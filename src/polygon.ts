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

import earcut from 'earcut';
import { vec2, vec3 } from 'gl-matrix';

import {
    Edge, isSerializedEdge, MutableEdge, SerializedEdge, unserializeEdge
} from './edge';
import { isThreeTuple, objectHasKey } from './util';

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
 * A Polygon with overridden properties.
 */
export type PolygonOverlay = Pick<
    Partial<Polygon>,
    "floorHeight" | "ceilHeight" | "floorTex" | "ceilTex" | "brightness"
> & { original: Polygon };

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
export const isSerializedPolygon = (poly: unknown): poly is SerializedPolygon => {
    if (typeof poly !== 'object' || poly === null) {
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
        if (!isSerializedEdge(poly.edges[i])) {
            return false;
        }
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
    return true;
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
