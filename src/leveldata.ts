/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

export interface SideData {
    vertex: number[];
    upperTex?: string;
    middleTex?: string;
    lowerTex?: string;
    backPoly?: number;
}

function isSideData(data: SideData): data is SideData {
    if (!Array.isArray(data.vertex)) {
        throw new Error('side vertex is not an Array');
    }
    if (data.vertex.length !== 2) {
        throw new Error('side vertex does not look like a vertex');
    }
    if (typeof data.vertex[0] !== 'number' && typeof data.vertex[1] !== 'number') {
        throw new Error('side vertex does not consist of two numbers');
    }
    if ('upperTex' in data && typeof data.upperTex !== 'string') {
        throw new Error('side upperTex is not a string');
    }
    if ('middleTex' in data && typeof data.middleTex !== 'string') {
        throw new Error('side middleTex is not a string');
    }
    if ('lowerTex' in data && typeof data.lowerTex !== 'string') {
        throw new Error('side lowerTex is not a string');
    }
    if ('backPoly' in data && typeof data.backPoly !== 'number') {
        throw new Error('side backPoly is not a number');
    }
    return true;
}

export interface PolygonData {
    sides: SideData[];
    ceilHeight: number;
    floorHeight: number;
    ceilTex: string;
    floorTex: string;
}

function isPolygonData(data: PolygonData): data is PolygonData {
    if (!Array.isArray(data.sides)) {
        throw new Error('polygon sides is not an Array');
    }
    if (data.sides.length < 3) {
        throw new Error('polygon sides does not have at least three sides');
    }
    for (let i = 0;i < data.sides.length;i++) {
        if (!isSideData(data.sides[i])) {
            return false;
        }
    }
    if (typeof data.ceilHeight !== 'number') {
        throw new Error('polygon ceilHeight is not a number');
    }
    if (typeof data.floorHeight !== 'number') {
        throw new Error('polygon floorHeight is not a number');
    }
    if (typeof data.ceilTex !== 'string') {
        throw new Error('polygon ceilTex is not a string');
    }
    if (typeof data.floorTex !== 'string') {
        throw new Error('polygon floorTex is not a string');
    }
    return true;
}

export interface LocationData {
    type: string,
    position: number[],
    rotation: number[],
}

function isLocationData(data: LocationData): data is LocationData {
    if (typeof data.type !== 'string') {
        throw new Error('location type is not a string');
    }
    if (!Array.isArray(data.position)) {
        throw new Error('location position is not an Array');
    }
    if (data.position.length !== 3) {
        throw new Error('location position does not look like a position');
    }
    if (typeof data.position[0] !== 'number' &&
        typeof data.position[1] !== 'number' &&
        typeof data.position[2] !== 'number') {
        throw new Error('location position does not consist of three numbers');
    }
    if (!Array.isArray(data.rotation)) {
        throw new Error('location rotation is not an Array');
    }
    if (data.rotation.length !== 3) {
        throw new Error('location rotation does not look like a rotation');
    }
    if (typeof data.rotation[0] !== 'number' &&
        typeof data.rotation[1] !== 'number' &&
        typeof data.rotation[2] !== 'number') {
        throw new Error('location rotation does not consist of three numbers');
    }
    return true;
}

export interface LevelData {
    polygons: PolygonData[];
    locations: LocationData[];
};

export function isLevelData(data: LevelData): data is LevelData {
    if (!Array.isArray(data.polygons)) {
        throw new Error('mapData polygons is not an Array');
    }
    if (data.polygons.length < 1) {
        throw new Error('mapData polygons does not have at least one polygon');
    }
    for (let i = 0;i < data.polygons.length;i++) {
        if (!isPolygonData(data.polygons[i])) {
            return false;
        }
    }
    if (!Array.isArray(data.locations)) {
        throw new Error('mapData locations is not an Array');
    }
    if (data.locations.length < 1) {
        throw new Error('mapData locations does not have at least one location');
    }
    for (let i = 0;i < data.locations.length;i++) {
        if (!isLocationData(data.locations[i])) {
            return false;
        }
    }
    return true;
}
