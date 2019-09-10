/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { vec3 } from 'gl-matrix';

import { flood, Hit, HitType, hitscanPolygon, Level } from '../src/level';
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

    const actual = hitscanPolygon(testLevel.polygons[0], startPos, startDir);
    expect(actual).not.toBeNull();
    expect((actual as Hit).type).toBe(HitType.Wall);
    expect(Array.prototype.slice.call((actual as Hit).pos)).toEqual([0, -64, 48]);
});

test('Hitscan Polygon (looking north, hits the tip of the staircase)', () => {
    const startPos = vec3.fromValues(0, 0, 48);
    const startDir = vec3.fromValues(0, 1, 0);

    const actual = hitscanPolygon(testLevel.polygons[0], startPos, startDir);
    expect(actual).not.toBeNull();
    expect((actual as Hit).type).toBe(HitType.Wall);
    expect(Array.prototype.slice.call((actual as Hit).pos)).toEqual([0, 256, 48]);
});

test('Hitscan Polygon (looking north, hits the floor)', () => {
    const startPos = vec3.fromValues(0, 0, 48);
    const startDir = vec3.fromValues(0, 1, -1);

    const actual = hitscanPolygon(testLevel.polygons[0], startPos, startDir);
    expect(actual).not.toBeNull();
    expect((actual as Hit).type).toBe(HitType.Floor);
    expect(Array.prototype.slice.call((actual as Hit).pos)).toEqual([0, 48, 0]);
});

test('Hitscan Polygon (looking north, hits the ceiling)', () => {
    const startPos = vec3.fromValues(0, 0, 48);
    const startDir = vec3.fromValues(0, 1, 1);

    const actual = hitscanPolygon(testLevel.polygons[0], startPos, startDir);
    expect(actual).not.toBeNull();
    expect((actual as Hit).type).toBe(HitType.Ceiling);
    expect(Array.prototype.slice.call((actual as Hit).pos)).toEqual([0, 80, 128]);
});

test('Hitscan Polygon (outside of the polygon)', () => {
    const startPos = vec3.fromValues(0, -128, 48);
    const startDir = vec3.fromValues(0, -1, 0);

    const actual = hitscanPolygon(testLevel.polygons[0], startPos, startDir);
    expect(actual).toBeNull();
});
