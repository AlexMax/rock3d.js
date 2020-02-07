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

import { readFileSync } from 'fs';
import { vec2, vec3 } from 'gl-matrix';

import { playerConfig } from '../src/entityConfig';
import {
    Hit, HitEdge, HitFloor, HitCeiling, HitType, hitscan, Level,
    assertSerializedLevel, createLevel, pointInPolygon, findPolygon,
    entityTouchesLevel, isTouchEdge
} from '../src/level';

let testLevel: Level;

beforeAll(() => {
    // Load the level.
    const mapJSON = readFileSync('asset/map/TESTMAP.json', {
        encoding: "utf8"
    });
    const map = JSON.parse(mapJSON);
    assertSerializedLevel(map);

    testLevel = createLevel(map);
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

describe('entityTouchesLevel', () => {
    /**
     * This test came from running straight into an outside corner - the
     * player entity was getting stuck in the corner.
     */
    test('Entity should collide with problematic corner', () => {
        const position = [
            315.44537353515625, 760, 32
        ];
        const velocity = [ // Not the actual velocity
            -1, 1, 0
        ];
        const hitDest = entityTouchesLevel(
            testLevel, playerConfig, velocity, position, 4
        );
        expect(isTouchEdge(hitDest)).toBe(true);
    });

    /**
     * This test came from approaching an outside corner hugging the wall,
     * as soon as you hit the intersection of the two walls, you got warped
     * directly to the corner.
     */
    test('Entity should be ejected from the correct wall', () => {
        const position = [
            333.4219665527344, 753.641357421875, 32
        ];
        const velocity = [ // Not the actual velocity
            -1, 1, 0
        ];
        const hitDest = entityTouchesLevel(
            testLevel, playerConfig, velocity, position, 4
        );
        expect(isTouchEdge(hitDest)).toBe(true);
        if (isTouchEdge(hitDest)) {
            expect(hitDest.edgeID).not.toBe(28);
        }
    });

    /**
     * This test came from an outside corner.  This time, you started at
     * the corner and then crept along the wall, before too long you got
     * telepoerted backwards towards the corner.
     */
    test('Entity should be ejected from the correct wall (2)', () => {
        const velocity = [
            0.8373914361000061, 15.978072166442871, 0
        ];
        const position = [
            312.3740234375, 759.989013671875, 32
        ];
        const hitDest = entityTouchesLevel(
            testLevel, playerConfig, velocity, position, 4
        );
        expect(isTouchEdge(hitDest)).toBe(true);
        if (isTouchEdge(hitDest)) {
            expect(hitDest.edgeID).not.toBe(28);
        }
    });
});
