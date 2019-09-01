/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import earcut from "earcut";
import { vec2, vec3, vec4 } from "gl-matrix";

import { LevelData, PolygonData, SideData } from "./leveldata";
import { intersectPlane, pointInCube, toPlane } from './math';

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

    constructor(levelData: LevelData) {
        this.polygons = levelData.polygons.map((data) => {
            return toPolygon(data);
        });
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
 * Cast a hitscan ray from a given starting position.
 */
export function hitscan(level: Level, startPoly: number, startPos: vec3,
    startDir: vec3): vec3 | null
{
    const poly = level.polygons[startPoly];
    const v2 = vec3.create();
    const planes = [vec4.create(), vec4.create(), vec4.create()];
 
    vec3.add(v2, startPos, startDir);

    for (let i = 0;i < poly.sides.length;i++) {
        const v3XY = poly.sides[i].vertex;
        const v4XY = poly.sides[(i + 1) % poly.sides.length].vertex;

        const v3 = vec3.fromValues(v3XY[0], v3XY[1], poly.floorHeight);
        const v4 = vec3.fromValues(v4XY[0], v4XY[1], poly.ceilHeight);

        // Check for line intersection on 3D plane.
        // FIXME: This is wasteful.  The planes should be calculated once
        //        and cached for later use.
        toPlane(planes[0],
            v3,
            v4,
            vec3.fromValues(v3XY[0], v3XY[1], poly.ceilHeight)
        );
        toPlane(planes[1],
            vec3.fromValues(0, 0, poly.floorHeight),
            vec3.fromValues(1, 1, poly.floorHeight),
            vec3.fromValues(1, 0, poly.floorHeight)
        );
        toPlane(planes[2],
            vec3.fromValues(0, 0, poly.ceilHeight),
            vec3.fromValues(1, 1, poly.ceilHeight),
            vec3.fromValues(1, 0, poly.ceilHeight)
        );

        const inters = planes.map((plane) => {
            return intersectPlane(vec3.create(), startPos, v2, plane);
        });
        const filtered = inters.map((inter, index) => {
            if (inter === null) {
                // Don't do anything with null intercepts.
                return null;
            }

            // Quickly discard points that didn't actually hit the wall
            // plane inside its actual boundary.
            // FIXME: Use Point-in-polygon on floors and ceiling.
            if (index === 0 && !pointInCube(inter, v3, v4)) {
                return null;
            }

            // Not every intersection is a valid one, because we're treating
            // the first line like a directed ray, not a segment.
            if (startDir[0] > 0 && inter[0] < startPos[0]) {
                return null; // Direction is +X, intersection is -X
            } else if (startDir[0] < 0 && inter[0] > startPos[0]) {
                return null; // Direction is -X, intersection is +X
            }
            if (startDir[1] > 0 && inter[1] < startPos[1]) {
                return null; // Direction is +Y, intersection is -Y
            } else if (startDir[1] < 0 && inter[1] > startPos[1]) {
                return null; // Direction is -Y, intersection is +Y
            }
            if (startDir[2] > 0 && inter[2] < startPos[2]) {
                return null; // Direction is +Z, intersection is -Z
            } else if (startDir[2] < 0 && inter[2] > startPos[2]) {
                return null; // Direction is -Z, intersection is +Z
            }

            return inter;
        });
        const dists = filtered.map((inter) => {
            if (inter === null) {
                // Don't do anything with null intercepts.
                return null;
            }

            return vec3.squaredDistance(startPos, inter);
        });

        // Find the least distance by index.
        let leastIndex = null;
        for (let i = 0;i < dists.length;i++) {
            const dist = dists[i];
            if (dist === null) {
                continue;
            }
            if (leastIndex === null || dist < leastIndex) {
                leastIndex = i;
            }
        }

        if (leastIndex === null) {
            // None of the planes are valid targets for the ray.
            continue;
        }

        return inters[leastIndex];
    }

    // Ray did not hit side of polygon.
    return null;
}
