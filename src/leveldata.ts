/**
 * rock3d.js: A 3D rendering engine with a retro heart.
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

export interface EdgeData {
    vertex: number[];
    upperTex?: string;
    middleTex?: string;
    lowerTex?: string;
    backPoly?: number;
}

function isEdgeData(data: EdgeData): data is EdgeData {
    if (!Array.isArray(data.vertex)) {
        throw new Error('edge vertex is not an Array');
    }
    if (data.vertex.length !== 2) {
        throw new Error('edge vertex does not look like a vertex');
    }
    if (typeof data.vertex[0] !== 'number' && typeof data.vertex[1] !== 'number') {
        throw new Error('edge vertex does not consist of two numbers');
    }
    if ('upperTex' in data && typeof data.upperTex !== 'string') {
        throw new Error('edge upperTex is not a string');
    }
    if ('middleTex' in data && typeof data.middleTex !== 'string') {
        throw new Error('edge middleTex is not a string');
    }
    if ('lowerTex' in data && typeof data.lowerTex !== 'string') {
        throw new Error('edge lowerTex is not a string');
    }
    if ('backPoly' in data && typeof data.backPoly !== 'number') {
        throw new Error('edge backPoly is not a number');
    }
    return true;
}

export interface PolygonData {
    edges: EdgeData[];
    ceilHeight: number;
    floorHeight: number;
    ceilTex: string;
    floorTex: string;
    brightness: number[];
}

function isPolygonData(data: PolygonData): data is PolygonData {
    if (!Array.isArray(data.edges)) {
        throw new Error('polygon edges is not an Array');
    }
    if (data.edges.length < 3) {
        throw new Error('polygon edges does not have at least three edges');
    }
    for (let i = 0;i < data.edges.length;i++) {
        if (!isEdgeData(data.edges[i])) {
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
    if (!Array.isArray(data.brightness)) {
        throw new Error('polygon brightness is not an Array');
    }
    if (data.brightness.length !== 3) {
        throw new Error('polygon brightness does not look like a vertex');
    }
    if (typeof data.brightness[0] !== 'number' &&
        typeof data.brightness[1] !== 'number' &&
        typeof data.brightness[2] !== 'number') {
        throw new Error('polygon brightness does not consist of two numbers');
    }
    return true;
}

export interface LocationData {
    type: string,
    polygon: number,
    position: number[],
    rotation: number[],
}

function isLocationData(data: LocationData): data is LocationData {
    if (typeof data.type !== 'string') {
        throw new Error('location type is not a string');
    }
    if (typeof data.polygon !== 'number') {
        throw new Error('location polygon is not a number');
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
