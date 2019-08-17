import earcut from "earcut";
import { vec2 } from "gl-matrix";

import { LevelData, PolygonData, SideData } from "./leveldata";

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
