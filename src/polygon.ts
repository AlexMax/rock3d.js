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

import earcut from 'earcut';
import { vec2, vec3 } from 'gl-matrix';

import {
    Edge, assertSerializedEdge, MutableEdge, SerializedEdge, unserializeEdge
} from './edge';
import { isThreeTuple, objectHasKey, isObject } from './util';

export interface MutablePolygon {
    /**
     * Edges of polygon, as ID's.
     */
    edgeIDs: number[];

    /**
     * Floor height.
     */
    floorHeight: number;

    /**
     * Ceiling height.
     */
    ceilHeight: number;

    /**
     * Floor texture.
     */
    floorTex: string;

    /**
     * Ceiling texture.
     */
    ceilTex: string;

    /**
     * Sector brightness.
     */
    brightness: vec3;

    /**
     * Tessellation vertex cache.
     */
    vertsCache: number[];

    /**
     * Tessellation index cache for floor.
     */
    floorIndsCache: number[];

    /**
     * Tessellation index cache for ceiling.
     */
    ceilIndsCache: number[];

    /**
     * Prevents accidental mutation of Polygon.
     */
    __mutable: true;
}

/**
 * A Polygon.
 *
 * Represents a room in the level.
 */
export type Polygon = Omit<Readonly<MutablePolygon>, "__mutable">;

/**
 * Cache a tessellation of the floor and ceiling.
 * 
 * @param out Polygon to tessellate.
 * @param edges Edges array.
 */
export const cacheTessellation = (
    out: MutablePolygon, edges: Edge[]
): MutablePolygon => {
    const verts: number[] = [];
    for (let i = 0;i < out.edgeIDs.length;i++) {
        const vert = edges[out.edgeIDs[i]].vertex;
        verts.push(vert[0]);
        verts.push(vert[1]);
    }
    out.vertsCache = verts;
    out.floorIndsCache = earcut(verts);
    out.ceilIndsCache = out.floorIndsCache.slice().reverse();
    return out;
}

/**
 * A Polygon as it would appear in JSON.
 */
export interface SerializedPolygon {
    edges: SerializedEdge[];
    floorHeight: number;
    ceilHeight: number;
    floorTex: string;
    ceilTex: string;
    brightness: [number, number, number];
}

/**
 * Type guard for serialized Polygon.
 */
export function assertSerializedPolygon(
    poly: unknown
): asserts poly is SerializedPolygon {
    if (!isObject(poly)) {
        throw new Error('polygon is not an object');
    }
    if (!objectHasKey('edges', poly)) {
        throw new Error('polygon does not have edges');
    }
    if (!Array.isArray(poly.edges)) {
        throw new Error('polygon edges is not an Array');
    }
    if (poly.edges.length < 3) {
        throw new Error('polygon edges does not have at least three edges');
    }
    for (let i = 0;i < poly.edges.length;i++) {
        assertSerializedEdge(poly.edges[i]);
    }
    if (!objectHasKey('floorHeight', poly)) {
        throw new Error('polygon does not have floorHeight');
    }
    if (typeof poly.floorHeight !== 'number') {
        throw new Error('polygon floorHeight is not a number');
    }
    if (!objectHasKey('ceilHeight', poly)) {
        throw new Error('polygon does not have ceilHeight');
    }
    if (typeof poly.ceilHeight !== 'number') {
        throw new Error('polygon ceilHeight is not a number');
    }
    if (!objectHasKey('floorTex', poly)) {
        throw new Error('polygon does not have floorTex');
    }
    if (typeof poly.floorTex !== 'string') {
        throw new Error('polygon floorTex is not a string');
    }
    if (!objectHasKey('ceilTex', poly)) {
        throw new Error('polygon does not have ceilTex');
    }
    if (typeof poly.ceilTex !== 'string') {
        throw new Error('polygon ceilTex is not a string');
    }
    if (!objectHasKey('brightness', poly)) {
        throw new Error('polygon does not have brightness');
    }
    if (!isThreeTuple(poly.brightness, 'number')) {
        throw new Error('polygon brightness is not an three-tuple');
    }
}

export const unserializePolygon = (
    poly: SerializedPolygon, edges: MutableEdge[]
): MutablePolygon => {
    // Keep track of our edges in an array of indexes.
    const edgeIDs: number[] = [];

    // Unpack vertexes first, so we can assign them later.
    const vertexes = poly.edges.map((edge) => {
        return vec2.fromValues(edge.vertex[0], edge.vertex[1]);
    });

    // Unpack edges next.
    poly.edges.forEach((edge, index) => {
        // Push our edge ID.
        const edgeID = edges.length;
        edgeIDs.push(edgeID);

        const v1 = vertexes[index];
        const v2 = vertexes[(index + 1) % poly.edges.length];
        edges.push(unserializeEdge(edge, v1, v2));
    });

    // New polygon object.
    const newPolygon = {
        edgeIDs: edgeIDs,
        floorHeight: poly.floorHeight,
        ceilHeight: poly.ceilHeight,
        floorTex: poly.floorTex,
        ceilTex: poly.ceilTex,
        brightness: vec3.fromValues(
            poly.brightness[0], poly.brightness[1], poly.brightness[2]
        ),
        vertsCache: [],
        floorIndsCache: [],
        ceilIndsCache: [],
    } as Polygon as MutablePolygon;

    return newPolygon;
}
