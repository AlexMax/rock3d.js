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
