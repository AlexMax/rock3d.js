/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import earcut from "earcut";
import { vec2, vec3, vec4, quat } from "gl-matrix";

import { Entity } from './entity';
import { LevelData, LocationData, PolygonData, SideData } from "./leveldata";
import { intersectPlane, pointInCube, pointInDirection3, toPlane, toEuler } from './math';

interface Side {
    vertex: vec2;
    upperTex: string | null;
    middleTex: string | null;
    lowerTex: string | null;
    backPoly: number | null;
}

function toSide(data: SideData): Side {
    return {
        vertex: vec2.fromValues(data.vertex[0], data.vertex[1]),
        upperTex: (typeof data.upperTex === 'string') ? data.upperTex : null,
        middleTex: (typeof data.middleTex === 'string') ? data.middleTex : null,
        lowerTex: (typeof data.lowerTex === 'string') ? data.lowerTex : null,
        backPoly: (typeof data.backPoly === 'number') ? data.backPoly : null,
    };
}

export interface Polygon {
    sides: Side[];
    ceilHeight: number;
    floorHeight: number;
    ceilTex: string;
    floorTex: string;
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
        sides: data.sides.map((data) => {
            return toSide(data);
        }),
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
    for (let i = 0;i < poly.sides.length;i++) {
        const vert = poly.sides[i].vertex;
        verts.push(vert[0]);
        verts.push(vert[1]);
    }
    poly.cacheVerts = verts;
    poly.floorCacheInds = earcut(verts);
    poly.ceilCacheInds = poly.floorCacheInds.slice().reverse();
}

export class Level {
    polygons: Polygon[];
    entities: Entity[];

    constructor(levelData: LevelData) {
        // Polygons are unpacked directly.
        this.polygons = levelData.polygons.map((data) => {
            return toPolygon(data);
        });

        // Locations can do many things to the level.
        this.entities = [];
        levelData.locations.forEach((location) => {
            this.unpackLocation(location);
        });
    }

    unpackLocation(location: LocationData) {
        switch (location.type) {
        case 'player':
            const entity: Entity = {
                pos: vec3.fromValues(location.position[0], location.position[1],
                    location.position[2]),
                rot: quat.fromEuler(quat.create(), location.rotation[0],
                    location.rotation[1], location.rotation[2]),
            };
            this.entities.push(entity);
            break;
        }
    }
}

type ShouldFloodFn = (level: Level, checkPoly: number, sourcePoly: number, side: number) => boolean;

function floodRecursive(level: Level, current: number,
    shouldFlood: ShouldFloodFn, flooded: Set<number>)
{
    flooded.add(current);
    const poly = level.polygons[current];
    for (let i = 0;i < poly.sides.length;i++) {
        const side = poly.sides[i];
        if (side.backPoly === null) {
            // There is no polygon to examine.
            continue;
        }
        if (flooded.has(side.backPoly)) {
            // We've already looked at this polygon.
            continue;
        }
        if (shouldFlood(level, side.backPoly, current, i) === false) {
            // We shouldn't flood this polygon.
            continue;
        }
        // Flood into this polygon.
        floodRecursive(level, side.backPoly, shouldFlood, flooded);
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
    floodRecursive(level, start, shouldFlood, flooded);
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
    wallNum?: number,
    entityNum?: number,
}

/**
 * Cast a hitscan ray from a given starting position into the geometry of
 * the level.
 * 
 * @param poly Polygon to cast histcan inside.
 * @param pos Ray origin.
 * @param dir Normalized ray direction.
 */
export function hitscanPolygon(poly: Polygon, pos: vec3, dir: vec3): Hit | null {
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
    for (let i = 0;i < poly.sides.length;i++) {
        const v32 = poly.sides[i].vertex;
        const v42 = poly.sides[(i + 1) % poly.sides.length].vertex;
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
        // Hit a wall.
        return {
            type: HitType.Wall,
            pos: shortestWallInter as vec3, // is never null
            wallNum: shortestWall as number, // is never null
        };
    }

    // Did not hit side of polygon.
    return null;
}
