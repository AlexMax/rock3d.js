/*
 * rock3d.js: A 3D game engine for making retro FPS games
 * Copyright (C) 2018 Alex Mayfield <alexmax2742@gmail.com>
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

import { quat, vec2, vec3 } from 'gl-matrix';

import {
    circleTouchesLine, intersectLines, pointInCircle, pointInCube, pointInRect,
    quatToEuler
} from '../src/math';

describe('circleTouchesLine', () => {
    test('Circle should touch line when close enough', () => {
        const a = vec2.fromValues(0, 32);
        const b = vec2.fromValues(32, 32);
        const c = vec2.fromValues(16, 17);
        const out = circleTouchesLine(vec2.create(), a, b, c, 16);

        expect(out).not.toBeNull();
        expect(out).toEqualVec2([16, 32]);
    });

    test('Circle should not touch line it\'s nowhere near', () => {
        const a = vec2.fromValues(0, 32);
        const b = vec2.fromValues(32, 32);
        const c = vec2.fromValues(16, 8);
        const out = circleTouchesLine(vec2.create(), a, b, c, 16);

        expect(out).toBeNull();
    });

    test('Circle should not touch edge of line', () => {
        const a = vec2.fromValues(0, 32);
        const b = vec2.fromValues(32, 32);
        const c = vec2.fromValues(16, 16);
        const out = circleTouchesLine(vec2.create(), a, b, c, 16);

        expect(out).toBeNull();
    });
});

describe('intersectLines', () => {
    test('Lines intersect', () => {
        const a = vec2.fromValues(0, 0);
        const b = vec2.fromValues(8, 4);
        const c = vec2.fromValues(2, 3);
        const d = vec2.fromValues(6, 1);

        const actual = intersectLines(vec2.create(), a, b, c, d);
        expect(actual).not.toBeNull();
        expect(actual).toEqualVec2([4, 2]);
    });

    test('Lines intersect (negative Y-axis)', () => {
        const a = vec2.fromValues(0, 0);
        const b = vec2.fromValues(8, -4);
        const c = vec2.fromValues(2, -3);
        const d = vec2.fromValues(6, -1);

        const actual = intersectLines(vec2.create(), a, b, c, d);
        expect(actual).not.toBeNull();
        expect(actual).toEqualVec2([4, -2]);
    });

    test('Lines intersect (Horizontal and Vertical)', () => {
        const a = vec2.fromValues(0, 1);
        const b = vec2.fromValues(2, 1);
        const c = vec2.fromValues(1, 0);
        const d = vec2.fromValues(1, 2);

        const actual = intersectLines(vec2.create(), a, b, c, d);
        expect(actual).not.toBeNull();
        expect(actual).toEqualVec2([1, 1]);
    });

    test('Lines do not intersect, they are parallel (X axis)', () => {
        const a = vec2.fromValues(0, 0);
        const b = vec2.fromValues(4, 0);
        const c = vec2.fromValues(0, 1);
        const d = vec2.fromValues(4, 1);

        const actual = intersectLines(vec2.create(), a, c, b, d);
        expect(actual).toBeNull();
    });

    test('Lines do not intersect, they are parallel (Y axis)', () => {
        const a = vec2.fromValues(0, 0);
        const b = vec2.fromValues(0, 4);
        const c = vec2.fromValues(1, 0);
        const d = vec2.fromValues(1, 4);

        const actual = intersectLines(vec2.create(), a, c, b, d);
        expect(actual).toBeNull();
    });

    test('Lines do not intersect, they are on the same line (X axis)', () => {
        const a = vec2.fromValues(0, 0);
        const b = vec2.fromValues(4, 0);
        const c = vec2.fromValues(8, 0);
        const d = vec2.fromValues(16, 0);

        const actual = intersectLines(vec2.create(), a, c, b, d);
        expect(actual).toBeNull();
    });

    test('Lines do not intersect, they are on the same line (Y axis)', () => {
        const a = vec2.fromValues(0, 0);
        const b = vec2.fromValues(0, 4);
        const c = vec2.fromValues(0, 8);
        const d = vec2.fromValues(0, 16);

        const actual = intersectLines(vec2.create(), a, c, b, d);
        expect(actual).toBeNull();
    });
});

describe('pointInCircle', () => {
    test('Point is in circle', () => {
        const a = vec2.fromValues(1, 1);
        const b = vec2.fromValues(2, 2);

        const actual = pointInCircle(a, b, 3);
        expect(actual).toBeTruthy();
    });

    test('Point is outside circle', () => {
        const a = vec2.fromValues(5, 5);
        const b = vec2.fromValues(2, 2);

        const actual = pointInCircle(a, b, 3);
        expect(actual).toBeFalsy();
    });
});

describe('pointInCube', () => {
    test('Point is in cube', () => {
        const p = vec3.fromValues(1, 1, 1);
        const a = vec3.fromValues(0, 0, 0);
        const b = vec3.fromValues(2, 2, 2);

        const actual = pointInCube(p, a, b);
        expect(actual).toBeTruthy();
    });

    test('Point is in cube (reversed coordinates)', () => {
        const p = vec3.fromValues(1, 1, 1);
        const a = vec3.fromValues(2, 2, 2);
        const b = vec3.fromValues(0, 0, 0);

        const actual = pointInCube(p, a, b);
        expect(actual).toBeTruthy();
    });

    test('Point is outside cube (X axis)', () => {
        const p = vec3.fromValues(3, 1, 1);
        const a = vec3.fromValues(2, 2, 2);
        const b = vec3.fromValues(0, 0, 0);

        const actual = pointInCube(p, a, b);
        expect(actual).toBeFalsy();
    });

    test('Point is outside cube (Y axis)', () => {
        const p = vec3.fromValues(1, 3, 1);
        const a = vec3.fromValues(2, 2, 2);
        const b = vec3.fromValues(0, 0, 0);

        const actual = pointInCube(p, a, b);
        expect(actual).toBeFalsy();
    });

    test('Point is outside cube (Z axis)', () => {
        const p = vec3.fromValues(1, 1, 3);
        const a = vec3.fromValues(2, 2, 2);
        const b = vec3.fromValues(0, 0, 0);

        const actual = pointInCube(p, a, b);
        expect(actual).toBeFalsy();
    });
});

describe('pointInRect', () => {
    test('Point is in rectangle', () => {
        const p = vec2.fromValues(1, 1);
        const a = vec2.fromValues(0, 0);
        const b = vec2.fromValues(2, 2);

        const actual = pointInRect(p, a, b);
        expect(actual).toBeTruthy();
    });

    test('Point is in rectangle (reversed coordinates)', () => {
        const p = vec2.fromValues(1, 1);
        const a = vec2.fromValues(2, 2);
        const b = vec2.fromValues(0, 0);

        const actual = pointInRect(p, a, b);
        expect(actual).toBeTruthy();
    });

    test('Point is outside rectangle (X axis)', () => {
        const p = vec2.fromValues(3, 1);
        const a = vec2.fromValues(2, 2);
        const b = vec2.fromValues(0, 0);

        const actual = pointInRect(p, a, b);
        expect(actual).toBeFalsy();
    });

    test('Point is outside rectangle (Y axis)', () => {
        const p = vec2.fromValues(1, 3);
        const a = vec2.fromValues(2, 2);
        const b = vec2.fromValues(0, 0);

        const actual = pointInRect(p, a, b);
        expect(actual).toBeFalsy();
    });
});

describe('quatToEuler', () => {
    test('Roundtrip Euler conversion of (0, 0, 0)', () => {
        const q = quat.fromEuler(quat.create(), 0, 0, 0);
        const actual = quatToEuler(vec3.create(), q);
        expect(actual).toEqualVec3([0, 0, 0]);
    });

    test('Roundtrip Euler conversion of (15, 30, 45)', () => {
        const q = quat.fromEuler(quat.create(), 15, 30, 45);
        const actual = quatToEuler(vec3.create(), q);
        expect(actual).toEqualVec3([15, 30, 45]);
    });

    test('Roundtrip Euler conversion of (15, 100, 45), checking Y-axis truncation', () => {
        const q = quat.fromEuler(quat.create(), 15, 100, 45);
        const actual = quatToEuler(vec3.create(), q);
        expect(actual[1]).toBeLessThan(90);
    });

    test('Roundtrip Euler conversion of (15, -100, 45), checking Y-axis truncation', () => {
        const q = quat.fromEuler(quat.create(), 15, -100, 45);
        const actual = quatToEuler(vec3.create(), q);
        expect(actual[1]).toBeGreaterThan(-90);
    });
});
