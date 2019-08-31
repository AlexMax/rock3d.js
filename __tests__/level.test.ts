/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { vec2 } from 'gl-matrix';

import { flood, hitscan, Level } from '../src/level';
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
    })).toEqual(new Set([0, 1, 2, 3, 4]));
});

test('Flood-fill that always fails', () => {
    expect(flood(testLevel, 0, () => {
        return false;
    })).toEqual(new Set([0]));
});

test('Hitscan (looking south, hits a flat wall)', () => {
    const startPos = vec2.fromValues(0, 0);
    const startDir = vec2.fromValues(0, -1);

    const actual = hitscan(testLevel, 0, startPos, startDir);
    expect(actual).not.toBeNull();
    expect(Array.prototype.slice.call(actual)).toEqual([0, -64]);
});

test('Hitscan (looking north, hits the tip of the staircase)', () => {
    const startPos = vec2.fromValues(0, 0);
    const startDir = vec2.fromValues(0, 1);

    const actual = hitscan(testLevel, 0, startPos, startDir);
    expect(actual).not.toBeNull();
    expect(Array.prototype.slice.call(actual)).toEqual([0, 256]);
});

test('Hitscan (outside of the polygon)', () => {
    const startPos = vec2.fromValues(0, -128);
    const startDir = vec2.fromValues(0, -1);

    const actual = hitscan(testLevel, 0, startPos, startDir);
    expect(actual).toBeNull();
});
