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

import { vec2 } from 'gl-matrix';

import { isTwoTuple, objectHasKey, isObject, Mutable, Immutable } from './util';

/**
 * An Edge that we can modify.
 */
export type MutableEdge = Mutable<{
    /**
     * First vertex of the edge.
     */
    vertex: vec2;

    /**
     * Second vertex of the edge, as a reference.
     */
    nextVertex: vec2;

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
     * Normal vector of Edge.
     *
     * Calculated at runtime.  Must be refreshed if current or next vertex
     * is moved.
     */
    normalCache?: vec2;
}>;

/**
 * An edge of a Polygon.
 *
 * Can either be a solid or a "portal" to another Polygon.
 */
export type Edge = Immutable<MutableEdge>;

/**
 * Cache normal vector of edge.
 */
export const cacheNormal = (edge: MutableEdge): MutableEdge => {
    const frontOne = edge.vertex;
    const frontTwo = edge.nextVertex;

    edge.normalCache = vec2.fromValues(
        frontTwo[1] - frontOne[1],
        -(frontTwo[0] - frontOne[0])
    );

    return edge;
}

/**
 * An Edge as it would appear in JSON.
 */
export interface SerializedEdge {
    vertex: [number, number];
    upperTex?: string;
    middleTex?: string;
    lowerTex?: string;
    backPoly?: number;
}

/**
 * Type guard for serialized Edge.
 */
export function assertSerializedEdge(
    edge: unknown
): asserts edge is SerializedEdge {
    if (!isObject(edge)) {
        throw new Error('edge is not an object');
    }
    if (!objectHasKey('vertex', edge)) {
        throw new Error('edge does not have a vertex');
    }
    if (!isTwoTuple(edge.vertex, 'number')) {
        throw new Error('edge vertex is not a two-tuple');
    }
    if (objectHasKey('upperTex', edge) && typeof edge.upperTex !== 'string') {
        throw new Error('edge upperTex is not a string');
    }
    if (objectHasKey('middleTex', edge) && typeof edge.middleTex !== 'string') {
        throw new Error('edge middleTex is not a string');
    }
    if (objectHasKey('lowerTex', edge) && typeof edge.lowerTex !== 'string') {
        throw new Error('edge lowerTex is not a string');
    }
    if (objectHasKey('backPoly', edge) && typeof edge.backPoly !== 'number') {
        throw new Error('edge backPoly is not a number');
    }
}

/**
 * Unserialize an Edge.
 */
export const unserializeEdge = (
    edge: SerializedEdge, v1: vec2, v2: vec2
): MutableEdge => {
    return {
        vertex: v1,
        nextVertex: v2,
        upperTex: (typeof edge.upperTex === 'string') ? edge.upperTex : null,
        middleTex: (typeof edge.middleTex === 'string') ? edge.middleTex : null,
        lowerTex: (typeof edge.lowerTex === 'string') ? edge.lowerTex : null,
        backPoly: (typeof edge.backPoly === 'number') ? edge.backPoly : null,
    } as MutableEdge;
}
