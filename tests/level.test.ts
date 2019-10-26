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

import { vec2, vec3 } from 'gl-matrix';

import {
    Hit, HitEdge, HitFloor, HitCeiling, HitType, hitscan, Level,
    isSerializedLevel, createLevel, pointInPolygon, findPolygon
} from '../src/level';

import TESTMAP from './TESTMAP.json';

let testLevel: Level;

beforeAll(() => {
    if (!isSerializedLevel(TESTMAP)) {
        throw new Error('TESTMAP is not valid level data');
    }

    testLevel = createLevel(TESTMAP);
});

describe('Hitscan', () => {
    test('Looking south, hits a flat wall', () => {
        const startPos = vec3.fromValues(0, 0, 48);
        const startDir = vec3.fromValues(0, -1, 0);

        const actual = hitscan(testLevel, 0, startPos, startDir);
        expect(actual).not.toBeNull();
        expect((actual as Hit).type).toBe(HitType.Edge);
        expect((actual as HitEdge).position).toEqualVec3([0, -64, 48]);
        expect((actual as HitEdge).polygonID).toEqual(0);
    });

    test('Looking north, goes through polys, hits wall', () => {
        const startPos = vec3.fromValues(0, 0, 48);
        const startDir = vec3.fromValues(0, 1, 0);

        const actual = hitscan(testLevel, 0, startPos, startDir);
        expect(actual).not.toBeNull();
        expect((actual as Hit).type).toBe(HitType.Edge);
        expect((actual as HitEdge).position).toEqualVec3([0, 768, 48]);
        expect((actual as HitEdge).polygonID).toEqual(4);
    });

    test('Looking north, hits the floor', () => {
        const startPos = vec3.fromValues(0, 0, 48);
        const startDir = vec3.fromValues(0, 1, -1);

        const actual = hitscan(testLevel, 0, startPos, startDir);
        expect(actual).not.toBeNull();
        expect((actual as Hit).type).toBe(HitType.Floor);
        expect((actual as HitFloor).position).toEqualVec3([0, 48, 0]);
        expect((actual as HitFloor).polygonID).toEqual(0);
    });

    test('Looking north, hits the ceiling', () => {
        const startPos = vec3.fromValues(0, 0, 48);
        const startDir = vec3.fromValues(0, 1, 1);

        const actual = hitscan(testLevel, 0, startPos, startDir);
        expect(actual).not.toBeNull();
        expect((actual as HitCeiling).type).toBe(HitType.Ceiling);
        expect((actual as HitCeiling).position).toEqualVec3([0, 80, 128]);
        expect((actual as HitCeiling).polygonID).toEqual(0);
    });

    test('Outside of the polygon, hits nothing', () => {
        const startPos = vec3.fromValues(0, -128, 48);
        const startDir = vec3.fromValues(0, -1, 0);

        const actual = hitscan(testLevel, 0, startPos, startDir);
        expect(actual).toBeNull();
    });
});

describe('Point in Polygon', () => {
    test('Point is inside polygon', () => {
        const point = vec2.fromValues(0, 0);
        const poly = testLevel.polygons[0];
        expect(pointInPolygon(testLevel, poly, point)).toEqual(true);
    });

    test('Point is on a horizontal edge', () => {
        const point = vec2.fromValues(0, -64);
        const poly = testLevel.polygons[0];
        expect(pointInPolygon(testLevel, poly, point)).toEqual(true);
    });

    test('Point is on a vertical edge', () => {
        const point = vec2.fromValues(-256, 0);
        const poly = testLevel.polygons[0];
        expect(pointInPolygon(testLevel, poly, point)).toEqual(true);
    });

    test('Point is outside polygon on the X axis', () => {
        const point = vec2.fromValues(-512, 0);
        const poly = testLevel.polygons[0];
        expect(pointInPolygon(testLevel, poly, point)).toEqual(false);
    });

    test('Point is outside polygon on the Y axis', () => {
        const point = vec2.fromValues(0, -256);
        const poly = testLevel.polygons[0];
        expect(pointInPolygon(testLevel, poly, point)).toEqual(false);
    });

    // This test is from a bug from using -Number.MAX_SAFE_INTEGER as the
    // origin of the test ray.
    test('Point does not expose inaccuracies in intersection tests', () => {
        const point = vec2.fromValues(227.54696655273438, 1027.773681640625);
        const poly = testLevel.polygons[5];
        expect(pointInPolygon(testLevel, poly, point)).toEqual(true);
    });
});

describe('Find Polygon', () => {
    test('Point is in the same polygon', () => {
        const point = vec2.fromValues(0, 0);
        expect(findPolygon(testLevel, 0, point)).toEqual(0);
    });

    test('Point is on the opposite side of the map', () => {
        const point = vec2.fromValues(256, 1568);
        expect(findPolygon(testLevel, 0, point)).toEqual(6);
    });

    test('Point is outside the map', () => {
        const point = vec2.fromValues(0, -256);
        expect(findPolygon(testLevel, 0, point)).toBeNull();
    });
});