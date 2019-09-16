/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { vec2, vec3 } from 'gl-matrix';

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
