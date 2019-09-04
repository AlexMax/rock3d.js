/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { quat, vec2, vec3 } from 'gl-matrix';

import {
    intersectLines, pointInCircle, pointInCube, pointInRect, toEuler
} from '../src/math';

declare global {
    namespace jest {
        interface Matchers<R> {
            toEqualVec2(expected: [number, number]): R
            toEqualVec3(expected: [number, number, number]): R
        }
    }
}

expect.extend({
    toEqualVec2(actual: vec2, expected: [number, number]) {
        const expect = vec2.fromValues(expected[0], expected[1]);
        if (vec2.equals(actual, expect)) {
            return {
                message: () => { return 'vec2 is equal'; },
                pass: true,
            };
        } else {
            return {
                message: () => { return 'vec2 is not equal'; },
                pass: false,
           };
        }
    },
    toEqualVec3(actual: vec3, expected: [number, number, number]) {
        const expect = vec3.fromValues(expected[0], expected[1], expected[2]);
        if (vec3.equals(actual, expect)) {
            return {
                message: () => `vec3 is ${actual}`,
                pass: true,
            };
        } else {
            return {
                message: () => `vec3 is ${actual}`,
                pass: false,
           };
        }
    }
});

describe('intersectLines', () => {
    test('Lines intersect', () => {
        const p = vec2.fromValues(0, 0);
        const q = vec2.fromValues(8, 4);
        const r = vec2.fromValues(2, 3);
        const s = vec2.fromValues(6, 1);

        const actual = intersectLines(vec2.create(), p, q, r, s);
        expect(actual).not.toBeNull();
        expect(actual).toEqualVec2([4, 2]);
    });

    test('Lines intersect (negative Y-axis)', () => {
        const p = vec2.fromValues(0, 0);
        const q = vec2.fromValues(8, -4);
        const r = vec2.fromValues(2, -3);
        const s = vec2.fromValues(6, -1);

        const actual = intersectLines(vec2.create(), p, q, r, s);
        expect(actual).not.toBeNull();
        expect(actual).toEqualVec2([4, -2]);
    });

    test('Lines intersect (Horizontal and Vertical)', () => {
        const p = vec2.fromValues(0, 1);
        const q = vec2.fromValues(2, 1);
        const r = vec2.fromValues(1, 0);
        const s = vec2.fromValues(1, 2);

        const actual = intersectLines(vec2.create(), p, q, r, s);
        expect(actual).not.toBeNull();
        expect(actual).toEqualVec2([1, 1]);
    });

    test('Lines do not intersect, they are parallel (X axis)', () => {
        const p = vec2.fromValues(0, 0);
        const r = vec2.fromValues(4, 0);
        const q = vec2.fromValues(0, 1);
        const s = vec2.fromValues(4, 1);

        const actual = intersectLines(vec2.create(), p, q, r, s);
        expect(actual).toBeNull();
    });

    test('Lines do not intersect, they are parallel (Y axis)', () => {
        const p = vec2.fromValues(0, 0);
        const r = vec2.fromValues(0, 4);
        const q = vec2.fromValues(1, 0);
        const s = vec2.fromValues(1, 4);

        const actual = intersectLines(vec2.create(), p, q, r, s);
        expect(actual).toBeNull();
    });

    test('Lines do not intersect, they are on the same line (X axis)', () => {
        const p = vec2.fromValues(0, 0);
        const r = vec2.fromValues(4, 0);
        const q = vec2.fromValues(8, 0);
        const s = vec2.fromValues(16, 0);

        const actual = intersectLines(vec2.create(), p, q, r, s);
        expect(actual).toBeNull();
    });

    test('Lines do not intersect, they are on the same line (Y axis)', () => {
        const p = vec2.fromValues(0, 0);
        const r = vec2.fromValues(0, 4);
        const q = vec2.fromValues(0, 8);
        const s = vec2.fromValues(0, 16);

        const actual = intersectLines(vec2.create(), p, q, r, s);
        expect(actual).toBeNull();
    });
});

describe('pointInCircle', () => {
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
});

describe('pointInCube', () => {
    test('Point is in cube', () => {
        const p = vec3.fromValues(1, 1, 1);
        const q = vec3.fromValues(0, 0, 0);
        const r = vec3.fromValues(2, 2, 2);

        const actual = pointInCube(p, q, r);
        expect(actual).toBeTruthy();
    });

    test('Point is in cube (reversed coordinates)', () => {
        const p = vec3.fromValues(1, 1, 1);
        const q = vec3.fromValues(2, 2, 2);
        const r = vec3.fromValues(0, 0, 0);

        const actual = pointInCube(p, q, r);
        expect(actual).toBeTruthy();
    });

    test('Point is outside cube (X axis)', () => {
        const p = vec3.fromValues(3, 1, 1);
        const q = vec3.fromValues(2, 2, 2);
        const r = vec3.fromValues(0, 0, 0);

        const actual = pointInCube(p, q, r);
        expect(actual).toBeFalsy();
    });

    test('Point is outside cube (Y axis)', () => {
        const p = vec3.fromValues(1, 3, 1);
        const q = vec3.fromValues(2, 2, 2);
        const r = vec3.fromValues(0, 0, 0);

        const actual = pointInCube(p, q, r);
        expect(actual).toBeFalsy();
    });

    test('Point is outside cube (Z axis)', () => {
        const p = vec3.fromValues(1, 1, 3);
        const q = vec3.fromValues(2, 2, 2);
        const r = vec3.fromValues(0, 0, 0);

        const actual = pointInCube(p, q, r);
        expect(actual).toBeFalsy();
    });
});

describe('pointInRect', () => {
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
});

describe('toEuler', () => {
    test('Roundtrip Euler conversion of (0, 0, 0)', () => {
        const p = quat.fromEuler(quat.create(), 0, 0, 0);
        const actual = toEuler(vec3.create(), p);
        expect(actual).toEqualVec3([0, 0, 0]);
    });

    test('Roundtrip Euler conversion of (15, 30, 45)', () => {
        const p = quat.fromEuler(quat.create(), 15, 30, 45);
        const actual = toEuler(vec3.create(), p);
        expect(actual).toEqualVec3([15, 30, 45]);
    });

    test('Roundtrip Euler conversion of (15, 100, 45), checking Y-axis truncation', () => {
        const p = quat.fromEuler(quat.create(), 15, 100, 45);
        const actual = toEuler(vec3.create(), p);
        expect(actual[1]).toBeLessThan(90);
    });

    test('Roundtrip Euler conversion of (15, -100, 45), checking Y-axis truncation', () => {
        const p = quat.fromEuler(quat.create(), 15, -100, 45);
        const actual = toEuler(vec3.create(), p);
        expect(actual[1]).toBeGreaterThan(-90);
    });
});
