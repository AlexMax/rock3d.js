/*
 * rock3d.js: A 3D game engine for making retro FPS games
 * Copyright (C) 2018 Alex Mayfield <alexmax2742@gmail.com>
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

import { vec2, vec3, vec4, glMatrix } from 'gl-matrix';

import { cacheNormal, Edge, MutableEdge } from './edge';
import {
    assertSerializedLocation, Location, SerializedLocation, unserializeLocation
} from './location';
import {
    intersectPlane, pointInCube, pointInDirection3, toPlane, intersectLines,
    pointInRect, circleTouchesLine
} from './math';
import {
    cacheTessellation, assertSerializedPolygon, Polygon, SerializedPolygon,
    unserializePolygon
} from './polygon';
import { objectHasKey, isObject, Mutable, Immutable, swizzle } from './util';
import { EntityConfig, entityTop, entityBottom } from './entityConfig';

/**
 * Mutable version of Level.
 */
export type MutableLevel = Mutable<{
    /**
     * All polygons in the level data.
     */
    polygons: Polygon[];

    /**
     * All edges in the level data.
     */
    edges: Edge[];

    /**
     * All locations in the level data.
     */
    locations: Location[];
}>;

/**
 * A Level contains all loaded level data.
 */
export type Level = Immutable<MutableLevel>;

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

/**
 * Check to see if a point is inside the passed polygon.
 * 
 * @param level Level data to traverse.
 * @param polygon Polygon to check against.
 * @param point Point to check.
 */
export const pointInPolygon = (
    level: Level, polygon: Polygon, point: vec2
): boolean => {
    // FIXME: Origin should probably use polygon bounding box.
    const origin = vec2.fromValues(-32768, point[1]);
    const out = vec2.create();

    let count = 0;
    for (const edgeID of polygon.edgeIDs) {
        const edge = level.edges[edgeID];

        // Check for an intersection.
        if (intersectLines(
            out, origin, point, edge.vertex, edge.nextVertex
        ) === null) {
            continue;
        }

        // Check to see if the intersection is in-bounds of both lines.
        if (out[0] > point[0] || !glMatrix.equals(out[1], point[1])) {
            continue;
        }
        if (!pointInRect(out, edge.vertex, edge.nextVertex)) {
            continue;
        }

        count += 1;
    }

    return (count % 2 === 0) ? false : true;
}

/**
 * Find out which polygon this position is inside, given a starting polygon.
 * 
 * @param level Level data to traverse.
 * @param startPoly Starting polygon index.
 * @param pos Position to find.
 */
export const findPolygon = (
    level: Level, startPoly: number, pos: vec2
): number | null => {
    const queue: number[] = [ startPoly ];
    const checked: Set<number> = new Set(queue);

    // Breadth-first search of polygons.
    while (queue.length !== 0) {
        const polyID = queue.shift() as number;
        const poly = level.polygons[polyID];
        if (pointInPolygon(level, poly, pos)) {
            return polyID;
        }

        for (const edgeID of poly.edgeIDs) {
            const edge = level.edges[edgeID];
            if (edge.backPoly !== null && !checked.has(edge.backPoly)) {
                queue.push(edge.backPoly);
                checked.add(edge.backPoly);
            }
        }
    }

    return null;
}

enum TouchType {
    Nothing,
    Void,
    Edge,
}

interface TouchNothing {
    type: TouchType.Nothing;

    /**
     * Set of polygons the entity is inside.
     */
    insidePolys: Set<number>;
}

interface TouchVoid {
    type: TouchType.Void;
}

interface TouchEdge {
    type: TouchType.Edge

    /**
     * Touch coordinates.
     */
    position: vec2;

    /**
     * Distance to touch coordinates.
     */
    distance: number;

    /**
     * Touched Edge ID.
     */
    edgeID: number;

    /**
     * Touched Polygon ID.
     */
    polygonID: number;
}

type Touch = TouchNothing | TouchVoid | TouchEdge;

export const isTouchNothing = (touch: Touch): touch is TouchNothing => {
    return touch.type === TouchType.Nothing;
}

export const isTouchVoid = (touch: Touch): touch is TouchVoid => {
    return touch.type === TouchType.Void;
}

export const isTouchEdge = (touch: Touch): touch is TouchEdge => {
    return touch.type === TouchType.Edge;
}

/**
 * Check to see if an entity can cross an edge or if the edge should be
 * considered a wall.
 */
const entityCanCrossEdge = (
    level: Level, polyID: number, edgeID: number, config: EntityConfig,
    pos: vec3
): boolean => {
    const poly = level.polygons[polyID];
    const edge = level.edges[edgeID];

    if (edge.backPoly === null) {
        // Edge does not have a backside.
        return false;
    }

    const backPoly = level.polygons[edge.backPoly];
    if (
        Math.min(poly.ceilHeight, backPoly.ceilHeight) -
        Math.max(poly.floorHeight, backPoly.floorHeight) < config.height
    ) {
        // Entity can't fit through the gap.
        return false;
    }

    const top = entityTop(config, pos);
    if (backPoly.ceilHeight < poly.ceilHeight && top > backPoly.ceilHeight) {
        // Entity would hit the ceiling "lip" between the two polygons.
        return false;
    }

    const bottom = entityBottom(config, pos);
    if (config.grounded === true) {
        // Grounded entities can step up on stairs.
        if (
            backPoly.floorHeight - 24 > poly.floorHeight &&
            entityBottom(config, pos) < backPoly.floorHeight
        ) {
            // Entity would hit the floor "lip" between the two polygons
            // which is higher than stair height.
            return false;
        }
    } else {
        // Floating entities do not consider stairs.
        if (
            backPoly.floorHeight > poly.floorHeight &&
            entityBottom(config, pos) < backPoly.floorHeight
        ) {
            // Entity would hit the floor "lip" between the two polygons.
            return false;
        }
    }

    return true;
}

/**
 * Find out where in the level a given entity is touching.
 *
 * @param level Level to collide against.
 * @param config Entity configuration.
 * @param velocity Current velocity of entity.
 * @param newPos New position to collide with.
 * @param startPoly Starting polygon to check.
 */
export const entityTouchesLevel = (
    level: Level, config: EntityConfig, velocity: vec3, newPos: vec3,
    startPoly: number | null
): Touch => {
    if (startPoly === null) {
        // Entity is in the void, any other check would be nonsense.
        return {
            type: TouchType.Void
        } as TouchVoid;
    }

    const queue: number[] = [ startPoly ];
    const checked: Set<number> = new Set(queue);
    const touchPos = vec2.create();
    const touch: TouchEdge = {
        type: TouchType.Edge,
        position: vec2.create(),
        distance: Infinity,
        edgeID: 0,
        polygonID: 0,
    };

    // Breadth-first search of polygons.
    while (queue.length !== 0) {
        const polyID = queue.shift() as number;
        const poly = level.polygons[polyID];
        for (const edgeID of poly.edgeIDs) {
            const edge = level.edges[edgeID];
            if (circleTouchesLine(
                touchPos, edge.vertex, edge.nextVertex, swizzle(newPos, [0, 1]), config.radius
            ) !== null) {
                // Discard touches that are aligned with the normal.  You
                // need to be able to walk through the back side of a wall,
                // lest collisions at corners become more complicated.
                if (vec2.dot(
                    swizzle(velocity, [0, 1]), swizzle(edge.normalCache as vec2, [0, 1])
                ) > 0) {
                    continue;
                }

                // Should we consider this edge a wall?
                if (entityCanCrossEdge(
                    level, polyID, edgeID, config, newPos
                )) {
                    if (edge.backPoly === null) {
                        throw new Error('edge.backPoly is null');
                    }

                    // Have we checked this backPoly already?
                    if (!checked.has(edge.backPoly)) {
                        queue.push(edge.backPoly);
                        checked.add(edge.backPoly);
                    }

                    // This is not considered a real "touch".
                    continue;
                }

                // Is this touch closer than the last touch we found?
                const dist = Math.hypot(
                    touchPos[0] - newPos[0], touchPos[1] - newPos[1]
                );
                if (dist < touch.distance) {
                    vec2.copy(touch.position, touchPos);
                    touch.distance = dist;
                    touch.edgeID = edgeID;
                    touch.polygonID = polyID;
                }
            }
        }
    }

    if (!isFinite(touch.distance)) {
        // No touch was found.
        return {
            type: TouchType.Nothing,
            insidePolys: checked
        } as TouchNothing;
    }

    return touch;
}

export interface SerializedLevel {
    polygons: SerializedPolygon[];
    locations: SerializedLocation[];
}

export function assertSerializedLevel(
    level: unknown
): asserts level is SerializedLevel {
    if (!isObject(level)) {
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
        assertSerializedPolygon(level.polygons[i]);
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
        assertSerializedLocation(level.locations[i]);
    }
}
