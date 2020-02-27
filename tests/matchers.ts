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

import { vec2, vec3 } from 'gl-matrix';

declare global {
    namespace jest {
        interface Matchers<R, T> {
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
