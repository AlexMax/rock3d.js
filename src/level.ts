/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import earcut from "earcut";
import { vec2, vec3, vec4, quat } from "gl-matrix";

import { LevelData, LocationData, PolygonData, EdgeData } from "./leveldata";
import { intersectPlane, pointInCube, pointInDirection3, toPlane } from './math';

interface Edge {
    /**
     * First vertex of the edge.  Second vertex is in the next edge.
     */
    vertex: vec2;

    /**
     * Upper texture.
     * 
     * Used on edge with a backside to texture the wall above the "portal".
     */
    upperTex: string | null;

    /**
     * Middle texture.
     * 
     * Used on normal walls with no backside as their primary wall texture
     * or sides with a backside when you want a texture covering the "portal".
     */
    middleTex: string | null;

    /**
     * Upper texture.
     * 
     * Used on sides with a backside to texture the wall below the "portal".
     */
    lowerTex: string | null;

    /**
     * Polygon ID of the polygon on the opposite side of this side.
     * 
     * Used if this side should be a portal to another polygon, or null if
     * the polygon should just be a wall.
     */
    backPoly: number | null;

    /**
     * ID of the edge in the backPoly that matches up with this edge.
     * 
     * This ID is calculated at runtime and is used by various functions
     * like hitscan routines that need to know which Edge is on the opposite
     * side of this Edge.
     */
    backEdgeCache?: number | null;
}

function toEdge(data: EdgeData): Edge {
    return {
        vertex: vec2.fromValues(data.vertex[0], data.vertex[1]),
        upperTex: (typeof data.upperTex === 'string') ? data.upperTex : null,
        middleTex: (typeof data.middleTex === 'string') ? data.middleTex : null,
        lowerTex: (typeof data.lowerTex === 'string') ? data.lowerTex : null,
        backPoly: (typeof data.backPoly === 'number') ? data.backPoly : null,
    };
}

export interface Polygon {
    edges: Edge[];
    ceilHeight: number;
    floorHeight: number;
    ceilTex: string;
    floorTex: string;
    brightness: vec3;
    cacheVerts: number[];
    floorCacheInds: number[];
    ceilCacheInds: number[];
}

function toPolygon(data: PolygonData): Polygon {
    return {
        ceilHeight: data.ceilHeight,
        floorHeight: data.floorHeight,
        ceilTex: data.ceilTex,
        floorTex: data.floorTex,
        edges: data.edges.map((data) => {
            return toEdge(data);
        }),
        brightness: vec3.fromValues(data.brightness[0], data.brightness[1],
            data.brightness[2]),
        cacheVerts: [],
        floorCacheInds: [],
        ceilCacheInds: [],
    };
}

/**
 * Cache a tessellation of the floor
 * 
 * @param poly Polygon to tessellate
 */
export function cacheFlats(poly: Polygon): void {
    const verts: number[] = [];
    for (let i = 0;i < poly.edges.length;i++) {
        const vert = poly.edges[i].vertex;
        verts.push(vert[0]);
        verts.push(vert[1]);
    }
    poly.cacheVerts = verts;
    poly.floorCacheInds = earcut(verts);
    poly.ceilCacheInds = poly.floorCacheInds.slice().reverse();
}

export interface EntityConfig {
    type: string,
    grounded: boolean,
};

function toConfig(config: string): EntityConfig {
    switch(config) {
    case 'player':
        return {
            type: config,
            grounded: true,
        };
    default:
        throw new Error(`Unknown entity type ${config}`);
    }
}

export interface Entity {
    config: EntityConfig,
    poly: number,
    pos: vec3,
    rot: quat,
};

function toEntity(data: LocationData): Entity {
    return {
        config: toConfig(data.type),
        poly: data.polygon,
        pos: vec3.fromValues(data.position[0], data.position[1], data.position[2]),
        rot: quat.fromEuler(quat.create(),
            data.rotation[0], data.rotation[1], data.rotation[2]),
    };
}

export class Level {
    polygons: Polygon[];
    entities: Entity[];

    constructor(levelData: LevelData) {
        // Polygons are unpacked directly.
        this.polygons = levelData.polygons.map((data) => {
            return toPolygon(data);
        });

        // Cache backPoly edge.
        for (const poly of this.polygons) {
            for (let i = 0;i < poly.edges.length;i++) {
                const backIndex = poly.edges[i].backPoly;
                if (backIndex === null) {
                    continue
                }

                // Front vertexes.
                const frontOne = poly.edges[i].vertex;
                const frontTwo = poly.edges[(i + 1) % poly.edges.length].vertex;

                // Find matching edge in backPoly.
                const backPoly = this.polygons[backIndex];
                for (let j = 0;j < backPoly.edges.length;j++) {
                    const backOne = backPoly.edges[j].vertex;
                    const backTwo = backPoly.edges[(j + 1) % backPoly.edges.length].vertex;

                    if (vec2.equals(frontOne, backTwo) && vec2.equals(frontTwo, backOne)) {
                        poly.edges[i].backEdgeCache = j;
                        break;
                    }
                }
            }
        }

        // Locations can do many things to the level.
        this.entities = [];
        levelData.locations.forEach((location) => {
            this.unpackLocation(location);
        });
    }

    unpackLocation(location: LocationData) {
        switch (location.type) {
        case 'player':
            const entity = toEntity(location);
            this.entities.push(entity);
            break;
        }
    }
}

type ShouldFloodFn = (level: Level, checkPoly: number, checkSide: number,
    sourcePoly: number | null, sourceSide: number | null) => boolean;

function floodRecursive(level: Level, checkPoly: number, lastPoly: number | null,
    lastEdge: number | null, shouldFlood: ShouldFloodFn, flooded: Set<number>)
{
    flooded.add(checkPoly);
    const poly = level.polygons[checkPoly];
    for (let i = 0;i < poly.edges.length;i++) {
        const edge = poly.edges[i];
        if (edge.backPoly === null) {
            // There is no polygon to examine.
            continue;
        }
        if (flooded.has(edge.backPoly)) {
            // We've already looked at this polygon.
            continue;
        }
        if (shouldFlood(level, checkPoly, i, lastPoly, lastEdge) === false) {
            // We shouldn't flood this polygon.
            continue;
        }
        // Flood into this polygon.
        floodRecursive(level, edge.backPoly, checkPoly, i, shouldFlood, flooded);
    }
}

/**
 * Return all polygons that are reachable from the passed starting polygon.
 *
 * @param level Level to traverse.
 * @param start Starting polygon index.
 * @param shouldFlood A function that returns true if the given polygon
 *                    should be included in the result set, otherwise false.
 */
export function flood(level: Level, start: number, shouldFlood: ShouldFloodFn): Set<number> {
    const flooded: Set<number> = new Set();
    floodRecursive(level, start, null, null, shouldFlood, flooded);
    return flooded;
}

/**
 * Defines possible types of return values from hitscan functions.
 */
export enum HitType {
    Wall,
    Floor,
    Ceiling,
    Entity,
}

/**
 * Defines possible return values from hitscan functions.
 */
export interface Hit {
    type: HitType,
    pos: vec3,
    polyNum?: number,
    wallNum?: number,
    entityNum?: number,
}

/**
 * Cast a hitscan ray from a given starting position into the geometry of
 * the level.
 * 
 * @param level Level to cast hitscan inside.
 * @param polyID Polygon ID of origin.
 * @param pos Ray origin.
 * @param dir Normalized ray direction.
 * @param ignoreWall Wall of polygon to ignore.
 */
export function hitscanPolygon(level: Level, polyID: number, pos: vec3,
    dir: vec3): Hit | null
{
    const poly = level.polygons[polyID];

    // Some functions require absolute position of startDir.
    const v2 = vec3.add(vec3.create(), pos, dir);

    // First, test collision with floor.
    const floorPlane = toPlane(vec4.create(),
        vec3.fromValues(0, 0, poly.floorHeight),
        vec3.fromValues(1, 1, poly.floorHeight),
        vec3.fromValues(1, 0, poly.floorHeight)
    );
    const floorInter = intersectPlane(vec3.create(), pos, v2, floorPlane);
    if (floorInter === null) {
        // Didn't hit.
        var floorDist = Infinity;
    } else if (!pointInDirection3(pos, dir, floorInter)) {
        // Wrong direction.
        var floorDist = Infinity;
    } else {
        var floorDist = vec3.squaredDistance(pos, floorInter);
    }

    // Next, test collision with ceiling.
    const ceilPlane = toPlane(vec4.create(),
        vec3.fromValues(0, 0, poly.ceilHeight),
        vec3.fromValues(1, 1, poly.ceilHeight),
        vec3.fromValues(1, 0, poly.ceilHeight)
    );
    const ceilInter = intersectPlane(vec3.create(), pos, v2, ceilPlane);
    if (ceilInter === null) {
        // Didn't hit.
        var ceilDist = Infinity;
    } else if (!pointInDirection3(pos, dir, ceilInter)) {
        // Wrong direction.
        var ceilDist = Infinity;
    } else {
        var ceilDist = vec3.squaredDistance(pos, ceilInter);
    }

    // Finally, test collisions with walls.
    let shortestWall: number | null = null;
    let shortestWallInter: vec3 = vec3.create();
    let shortestWallDist: number = Infinity;

    const wallInter = vec3.create();
    for (let i = 0;i < poly.edges.length;i++) {
        const v32 = poly.edges[i].vertex;
        const v42 = poly.edges[(i + 1) % poly.edges.length].vertex;
        const v3 = vec3.fromValues(v32[0], v32[1], poly.floorHeight);
        const v4 = vec3.fromValues(v42[0], v42[1], poly.ceilHeight);
        const v5 = vec3.fromValues(v42[0], v42[1], poly.floorHeight);

        // Construct a plane for the wall.
        // FIXME: This should be cached someplace.
        const plane = toPlane(vec4.create(), v3, v4, v5);

        // Check for plane intersection.
        const didInter = intersectPlane(wallInter, pos, v2, plane);
        if (didInter === null) {
            // No intersection.
            continue;
        }

        if (!pointInCube(wallInter, v3, v4)) {
            // Fails destination AABB test.
            continue;
        }

        if (!pointInDirection3(pos, dir, wallInter)) {
            // Fails directional AABB test.
            continue;
        }

        // We hit a wall.  But did we hit the closest wall?
        const wallDist = vec3.squaredDistance(pos, wallInter);
        if (shortestWall === null || wallDist < shortestWallDist) {
            shortestWall = i;
            vec3.copy(shortestWallInter, wallInter);
            shortestWallDist = wallDist;
        }
    }

    if (isFinite(ceilDist) && ceilDist < shortestWallDist && ceilDist < floorDist) {
        // Hit the ceiling.
        return {
            type: HitType.Ceiling,
            pos: ceilInter as vec3, // is never null
        };
    }
    if (isFinite(floorDist) && floorDist < shortestWallDist && floorDist < ceilDist) {
        // Hit the floor.
        return {
            type: HitType.Floor,
            pos: floorInter as vec3, // is never null
        };
    }
    if (isFinite(shortestWallDist)) {
        const backPolyID = poly.edges[(shortestWall as number)].backPoly;
        const backEdgeID = poly.edges[(shortestWall as number)].backEdgeCache as number;
        if (backPolyID !== null) {
            // Check if our hitscan is in-bounds in the next polygon.
            const backPoly = level.polygons[backPolyID];
            if ((shortestWallInter as vec3)[2] > backPoly.floorHeight &&
                (shortestWallInter as vec3)[2] < backPoly.ceilHeight)
            {
                // Continue our hitscan into the next polygon.
                return hitscanPolygon(level, backPolyID, shortestWallInter, dir);
            }
        }

        // Hit a wall.
        return {
            type: HitType.Wall,
            pos: shortestWallInter as vec3, // is never null
            polyNum: polyID,
            wallNum: shortestWall as number, // is never null
        };
    }

    // Did not hit polygon.
    return null;
}
