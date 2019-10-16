/**
 * rock3d.js: A 3D game engine with a retro heart.
 * Copyright (C) 2018-2019  Alex Mayfield <alexmax2742@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { vec2, vec3, vec4 } from 'gl-matrix';

import { cacheNormal, Edge, MutableEdge } from './edge';
import {
    isSerializedLocation, Location, SerializedLocation, unserializeLocation
} from './location';
import {
    intersectPlane, pointInCube, pointInDirection3, toPlane
} from './math';
import {
    cacheTessellation, isSerializedPolygon, Polygon, SerializedPolygon,
    unserializePolygon
} from './polygon';
import { objectHasKey } from './util';

/**
 * Mutable version of Level.
 */
export interface MutableLevel {
    polygons: Polygon[];
    edges: Edge[];
    locations: Location[];
    __mutable: true;
}

/**
 * A Level contains all loaded level data.
 */
export type Level = Omit<Readonly<MutableLevel>, "__mutable">;

/**
 * Create an empty Level structure.
 */
export const createEmptyLevel = (): MutableLevel => {
    return {
        polygons: [],
        edges: [],
        locations: [],
    } as Level as MutableLevel;
}

/**
 * Create a level from serialized level data.
 *
 * @param level Serialized level data.
 */
export const createLevel = (level: SerializedLevel): MutableLevel => {
    // We keep edges in a separate array.
    const edges: MutableEdge[] = [];

    // Polygons are unpacked, edges are unpacked into the array at the
    // same time.
    const polygons = level.polygons.map((data) => {
        return unserializePolygon(data, edges);
    });

    // Cache polygon tessellation.
    for (const poly of polygons) {
        cacheTessellation(poly, edges);
    }

    // Cache edge normal vector.
    for (const edge of edges) {
        cacheNormal(edge);
    }

    // Locations are unpacked directly.
    const locations = level.locations.map((data) => {
        return unserializeLocation(data);
    });

    return {
        polygons: polygons,
        edges: edges,
        locations: locations,
    } as Level as MutableLevel;
}

/**
 * Shallow-copy a level to a target mutable level.
 *
 * This makes copies of the level data arrays, but the references inside
 * those arrays remain the same.  You can't mutate those references, but
 * you can replace the references with brand new ones.
 */
export const copyLevel = (out: MutableLevel, level: Level): MutableLevel => {
    out.polygons.splice(0, level.polygons.length, ...level.polygons);
    out.edges.splice(0, level.edges.length, ...level.edges);
    out.locations.splice(0, level.locations.length, ...level.locations);
    return out;
}

type ShouldFloodFn = (level: Level, checkPoly: number, checkSide: number,
    sourcePoly: number | null, sourceSide: number | null) => boolean;

const floodRecursive = (
    level: Level, checkPoly: number, lastPoly: number | null,
    lastEdge: number | null, shouldFlood: ShouldFloodFn, flooded: Set<number>
): void => {
    flooded.add(checkPoly);
    const poly = level.polygons[checkPoly];
    for (let i = 0;i < poly.edgeIDs.length;i++) {
        const edge = level.edges[poly.edgeIDs[i]];
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
export const flood = (
    level: Level, start: number, shouldFlood: ShouldFloodFn
): Set<number> => {
    const flooded: Set<number> = new Set();
    floodRecursive(level, start, null, null, shouldFlood, flooded);
    return flooded;
}

/**
 * Defines possible types of return values from hitscan functions.
 */
export enum HitType {
    Edge,
    Floor,
    Ceiling,
    Entity,
}

/**
 * Hit an Edge.
 */
export interface HitEdge {
    type: HitType.Edge;

    /**
     * Position of hit.
     */
    position: vec3;

    /**
     * Polygon ID of hit.
     */
    polygonID: number;

    /**
     * Edge ID of hit.
     */
    edgeID: number;
}

/**
 * Hit the floor of a Polygon.
 */
export interface HitFloor {
    type: HitType.Floor;

    /**
     * Position of hit.
     */
    position: vec3;

    /**
     * Polygon ID of hit.
     */
    polygonID: number;
}

/**
 * Hit the ceiling of a Polygon.
 */
export interface HitCeiling {
    type: HitType.Ceiling;

    /**
     * Position of hit.
     */
    position: vec3;

    /**
     * Polygon ID of hit.
     */
    polygonID: number;
}

/**
 * Hit an Entity.
 */
export interface HitEntity {
    type: HitType.Entity;

    /**
     * Position of hit.
     */
    position: vec3;

    /**
     * Entity ID of hit.
     */
    entityID: number;
}

/**
 * Possible return values from hitscan function.
 */
export type Hit = HitEdge | HitFloor | HitCeiling | HitEntity;

/**
 * Cast a hitscan ray from a given starting position into the geometry of
 * the level.
 * 
 * @param level Level to cast hitscan inside.
 * @param polyID Polygon ID of origin.
 * @param position Ray origin.
 * @param direction Normalized ray direction.
 */
export const hitscan = (
    level: Level, polyID: number, position: vec3, direction: vec3
): Hit | null => {
    const poly = level.polygons[polyID];

    // Some functions require absolute position of startDir.
    const v2 = vec3.add(vec3.create(), position, direction);

    // First, test collision with floor.
    const floorPlane = toPlane(vec4.create(),
        vec3.fromValues(0, 0, poly.floorHeight),
        vec3.fromValues(1, 1, poly.floorHeight),
        vec3.fromValues(1, 0, poly.floorHeight)
    );
    const floorInter = intersectPlane(vec3.create(), position, v2, floorPlane);
    let floorDist = Infinity;
    if (floorInter === null) {
        // Didn't hit.
    } else if (!pointInDirection3(position, direction, floorInter)) {
        // Wrong direction.
    } else {
        floorDist = vec3.squaredDistance(position, floorInter);
    }

    // Next, test collision with ceiling.
    const ceilPlane = toPlane(vec4.create(),
        vec3.fromValues(0, 0, poly.ceilHeight),
        vec3.fromValues(1, 1, poly.ceilHeight),
        vec3.fromValues(1, 0, poly.ceilHeight)
    );
    const ceilInter = intersectPlane(vec3.create(), position, v2, ceilPlane);
    let ceilDist = Infinity;
    if (ceilInter === null) {
        // Didn't hit.
    } else if (!pointInDirection3(position, direction, ceilInter)) {
        // Wrong direction.
    } else {
        ceilDist = vec3.squaredDistance(position, ceilInter);
    }

    // Finally, test collisions with walls.
    let shortestWall: number | null = null;
    const shortestWallInter = vec3.create();
    let shortestWallDist = Infinity;

    const wallInter = vec3.create();
    for (let i = 0;i < poly.edgeIDs.length;i++) {
        // Get our edge.
        const edge = level.edges[poly.edgeIDs[i]];

        // Only consider edges that we can hit the front of.
        const normal = edge.normalCache as vec2;
        if (vec2.dot([direction[0], direction[1]], normal) >= 0) {
            continue;
        }

        const v32 = edge.vertex;
        const v42 = edge.nextVertex;
        const v3 = vec3.fromValues(v32[0], v32[1], poly.floorHeight);
        const v4 = vec3.fromValues(v42[0], v42[1], poly.ceilHeight);
        const v5 = vec3.fromValues(v42[0], v42[1], poly.floorHeight);

        // Construct a plane for the wall.
        // FIXME: This should be cached someplace.
        const plane = toPlane(vec4.create(), v3, v4, v5);

        // Check for plane intersection.
        const didInter = intersectPlane(wallInter, position, v2, plane);
        if (didInter === null) {
            // No intersection.
            continue;
        }

        if (!pointInCube(wallInter, v3, v4)) {
            // Fails destination AABB test.
            continue;
        }

        if (!pointInDirection3(position, direction, wallInter)) {
            // Fails directional AABB test.
            continue;
        }

        // We hit a wall.  But did we hit the closest wall?
        const wallDist = vec3.squaredDistance(position, wallInter);
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
            position: ceilInter as vec3, // is never null
            polygonID: polyID,
        };
    }
    if (isFinite(floorDist) && floorDist < shortestWallDist && floorDist < ceilDist) {
        // Hit the floor.
        return {
            type: HitType.Floor,
            position: floorInter as vec3, // is never null
            polygonID: polyID,
        };
    }
    if (isFinite(shortestWallDist)) {
        const edge = level.edges[poly.edgeIDs[(shortestWall as number)]];
        const backPolyID = edge.backPoly;
        if (backPolyID !== null) {
            // Check if our hitscan is in-bounds in the next polygon.
            const backPoly = level.polygons[backPolyID];
            if (
                shortestWallInter[2] > backPoly.floorHeight &&
                shortestWallInter[2] < backPoly.ceilHeight
            ) {
                // Continue our hitscan into the next polygon.
                return hitscan(level, backPolyID, shortestWallInter, direction);
            }
        }

        // Hit a wall.
        return {
            type: HitType.Edge,
            position: shortestWallInter,
            polygonID: polyID,
            edgeID: shortestWall as number, // is never null
        };
    }

    // Did not hit polygon.
    return null;
}

export interface SerializedLevel {
    polygons: SerializedPolygon[];
    locations: SerializedLocation[];
}

export const isSerializedLevel = (
    level: unknown
): level is SerializedLevel => {
    if (typeof level !== 'object' || level === null) {
        throw new Error('level is not an object');
    }
    if (!objectHasKey('polygons', level)) {
        throw new Error('level does not have polygons');
    }
    if (!Array.isArray(level.polygons)) {
        throw new Error('level polygons is not an Array');
    }
    if (level.polygons.length < 1) {
        throw new Error('level polygons does not have at least one polygon');
    }
    for (let i = 0;i < level.polygons.length;i++) {
        if (!isSerializedPolygon(level.polygons[i])) {
            return false;
        }
    }
    if (!objectHasKey('locations', level)) {
        throw new Error('level does not have locations');
    }
    if (!Array.isArray(level.locations)) {
        throw new Error('level locations is not an Array');
    }
    if (level.locations.length < 1) {
        throw new Error('level locations does not have at least one location');
    }
    for (let i = 0;i < level.locations.length;i++) {
        if (!isSerializedLocation(level.locations[i])) {
            return false;
        }
    }
    return true;
}
