/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { vec2 } from 'gl-matrix';

import { intersectLines, pointInCircle, pointInRect } from '../src/math';

test('Lines intersect', () => {
    const p = vec2.fromValues(0, 0);
    const q = vec2.fromValues(8, 4);
    const r = vec2.fromValues(2, 3);
    const s = vec2.fromValues(6, 1);

    const actual = intersectLines(p, q, r, s);
    expect(actual).not.toBeNull();
    expect(Array.prototype.slice.call(actual)).toEqual([4, 2]);
});

test('Lines intersect (negative Y-axis)', () => {
    const p = vec2.fromValues(0, 0);
    const q = vec2.fromValues(8, -4);
    const r = vec2.fromValues(2, -3);
    const s = vec2.fromValues(6, -1);

    const actual = intersectLines(p, q, r, s);
    expect(actual).not.toBeNull();
    expect(Array.prototype.slice.call(actual)).toEqual([4, -2]);
});

test('Lines intersect (Horizontal and Vertical)', () => {
    const p = vec2.fromValues(0, 1);
    const q = vec2.fromValues(2, 1);
    const r = vec2.fromValues(1, 0);
    const s = vec2.fromValues(1, 2);

    const actual = intersectLines(p, q, r, s);
    expect(actual).not.toBeNull();
    expect(Array.prototype.slice.call(actual)).toEqual([1, 1]);
});

test('Lines do not intersect, they are parallel (X axis)', () => {
    const p = vec2.fromValues(0, 0);
    const r = vec2.fromValues(4, 0);
    const q = vec2.fromValues(0, 1);
    const s = vec2.fromValues(4, 1);

    const actual = intersectLines(p, q, r, s);
    expect(actual).toBeNull();
});

test('Lines do not intersect, they are parallel (Y axis)', () => {
    const p = vec2.fromValues(0, 0);
    const r = vec2.fromValues(0, 4);
    const q = vec2.fromValues(1, 0);
    const s = vec2.fromValues(1, 4);

    const actual = intersectLines(p, q, r, s);
    expect(actual).toBeNull();
});

test('Lines do not intersect, they are on the same line (X axis)', () => {
    const p = vec2.fromValues(0, 0);
    const r = vec2.fromValues(4, 0);
    const q = vec2.fromValues(8, 0);
    const s = vec2.fromValues(16, 0);

    const actual = intersectLines(p, q, r, s);
    expect(actual).toBeNull();
});

test('Lines do not intersect, they are on the same line (Y axis)', () => {
    const p = vec2.fromValues(0, 0);
    const r = vec2.fromValues(0, 4);
    const q = vec2.fromValues(0, 8);
    const s = vec2.fromValues(0, 16);

    const actual = intersectLines(p, q, r, s);
    expect(actual).toBeNull();
});

test('Point is in circle', () => {
    const p = vec2.fromValues(1, 1);
    const q = vec2.fromValues(2, 2);

    const actual = pointInCircle(p, q, 3);
    expect(actual).toBeTruthy();
});

test('Point is outside circle', () => {
    const p = vec2.fromValues(5, 5);
    const q = vec2.fromValues(2, 2);

    const actual = pointInCircle(p, q, 3);
    expect(actual).toBeFalsy();
});

test('Point is in rectangle', () => {
    const p = vec2.fromValues(1, 1);
    const q = vec2.fromValues(0, 0);
    const r = vec2.fromValues(2, 2);

    const actual = pointInRect(p, q, r);
    expect(actual).toBeTruthy();
});

test('Point is in rectangle (reversed coordinates)', () => {
    const p = vec2.fromValues(1, 1);
    const q = vec2.fromValues(2, 2);
    const r = vec2.fromValues(0, 0);

    const actual = pointInRect(p, q, r);
    expect(actual).toBeTruthy();
});

test('Point is outside rectangle (X axis)', () => {
    const p = vec2.fromValues(3, 1);
    const q = vec2.fromValues(2, 2);
    const r = vec2.fromValues(0, 0);

    const actual = pointInRect(p, q, r);
    expect(actual).toBeFalsy();
});

test('Point is outside rectangle (Y axis)', () => {
    const p = vec2.fromValues(1, 3);
    const q = vec2.fromValues(2, 2);
    const r = vec2.fromValues(0, 0);

    const actual = pointInRect(p, q, r);
    expect(actual).toBeFalsy();
});

