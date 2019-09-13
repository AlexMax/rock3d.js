/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { vec3 } from 'gl-matrix';

import {
    flood, Hit, HitEdge, HitFloor, HitCeiling, HitType, hitscan, Level
} from '../src/level';
import { isLevelData } from '../src/leveldata';

import TESTMAP from './TESTMAP.json';

let testLevel: Level;

beforeAll(() => {
    if (!isLevelData(TESTMAP)) {
        throw new Error('TESTMAP is not valid LevelData');
    }

    testLevel = new Level(TESTMAP);
});

test('Flood-fill that always succeeds', () => {
    expect(flood(testLevel, 0, () => {
        return true;
    })).toEqual(new Set([0, 1, 2, 3, 4, 5]));
});

test('Flood-fill that always fails', () => {
    expect(flood(testLevel, 0, () => {
        return false;
    })).toEqual(new Set([0]));
});

test('Hitscan Polygon (looking south, hits a flat wall)', () => {
    const startPos = vec3.fromValues(0, 0, 48);
    const startDir = vec3.fromValues(0, -1, 0);

    const actual = hitscan(testLevel, 0, startPos, startDir);
    expect(actual).not.toBeNull();
    expect((actual as Hit).type).toBe(HitType.Edge);
    expect((actual as HitEdge).position).toEqualVec3([0, -64, 48]);
    expect((actual as HitEdge).polyNum).toEqual(0);
});

test('Hitscan Polygon (looking north, goes through polys, hits wall)', () => {
    const startPos = vec3.fromValues(0, 0, 48);
    const startDir = vec3.fromValues(0, 1, 0);

    const actual = hitscan(testLevel, 0, startPos, startDir);
    expect(actual).not.toBeNull();
    expect((actual as Hit).type).toBe(HitType.Edge);
    expect((actual as HitEdge).position).toEqualVec3([0, 768, 48]);
    expect((actual as HitEdge).polyNum).toEqual(4);
});

test('Hitscan Polygon (looking north, hits the floor)', () => {
    const startPos = vec3.fromValues(0, 0, 48);
    const startDir = vec3.fromValues(0, 1, -1);

    const actual = hitscan(testLevel, 0, startPos, startDir);
    expect(actual).not.toBeNull();
    expect((actual as Hit).type).toBe(HitType.Floor);
    expect((actual as HitFloor).position).toEqualVec3([0, 48, 0]);
    expect((actual as HitFloor).polyNum).toEqual(0);
});

test('Hitscan Polygon (looking north, hits the ceiling)', () => {
    const startPos = vec3.fromValues(0, 0, 48);
    const startDir = vec3.fromValues(0, 1, 1);

    const actual = hitscan(testLevel, 0, startPos, startDir);
    expect(actual).not.toBeNull();
    expect((actual as HitCeiling).type).toBe(HitType.Ceiling);
    expect((actual as HitCeiling).position).toEqualVec3([0, 80, 128]);
    expect((actual as HitCeiling).polyNum).toEqual(0);
});

test('Hitscan Polygon (outside of the polygon)', () => {
    const startPos = vec3.fromValues(0, -128, 48);
    const startDir = vec3.fromValues(0, -1, 0);

    const actual = hitscan(testLevel, 0, startPos, startDir);
    expect(actual).toBeNull();
});
