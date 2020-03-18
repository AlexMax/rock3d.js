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

import { swizzle } from "../src/util";

describe('swizzle', () => {
    it('Proxy should be considered an array', () => {
        const v1 = [1, 2, 3, 4];
        const s1 = swizzle(v1, [3, 2, 1, 0]);
        expect(Array.isArray(s1)).toBe(true);
    });
    it('Proxy should correctly proxy getters', () => {
        const v1 = [1, 2, 3, 4];

        // Reverse all four indexes.
        const s1 = swizzle(v1, [3, 2, 1, 0]);
        expect(s1[0]).toBe(4);
        expect(s1[1]).toBe(3);
        expect(s1[2]).toBe(2);
        expect(s1[3]).toBe(1);

        // Reverse just two indexes as a two-tuple.
        const s2 = swizzle(v1, [2, 1]);
        expect(s2[0]).toBe(3);
        expect(s2[1]).toBe(2);

        // What happens if we access an out of bounds index?
        expect(s2[-1 as number]).toBe(undefined);
        expect(s2[5 as number]).toBe(undefined);
    });

    it('Proxy should correctly proxy setters', () => {
        // Reverse all four indexes.
        const v1 = [1, 2, 3, 4];
        const s1 = swizzle(v1, [3, 2, 1, 0]);
        s1[0] = 5;
        s1[1] = 6;
        s1[2] = 7;
        s1[3] = 8;
        expect(s1[0]).toBe(5); // our proxy
        expect(s1[1]).toBe(6);
        expect(s1[2]).toBe(7);
        expect(s1[3]).toBe(8);
        expect(v1[0]).toBe(8); // the original vector
        expect(v1[1]).toBe(7);
        expect(v1[2]).toBe(6);
        expect(v1[3]).toBe(5);

        // Reverse just two indexes as a two-tuple.
        const v2 = [1, 2, 3, 4];
        const s2 = swizzle(v2, [2, 1]);
        s2[0] = 5;
        s2[1] = 6;
        expect(s2[0]).toBe(5); // our proxy
        expect(s2[1]).toBe(6);
        expect(v2[0]).toBe(1); // the original vector
        expect(v2[1]).toBe(6);
        expect(v2[2]).toBe(5);
        expect(v2[3]).toBe(4);

        // Test that we're throwing an exception on out-of-bounds array index.
        const t = () => {
            const v3 = [1, 2, 3, 4];
            const s3 = swizzle(v3, [2, 1]);
            s3[2 as number] = 0;
        }
        expect(t).toThrow(TypeError);
    });

    it('Proxy should correctly iterate', () => {
        const v1 = [1, 2, 3, 4];
        const s1 = swizzle(v1, [3, 2, 1]);
        const out = [];

        // Numeric for loop.
        for (let i = 0;i < s1.length;i++) {
            out.push(s1[i]);
        }
        expect(out[0]).toBe(4);
        expect(out[1]).toBe(3);
        expect(out[2]).toBe(2);
        out.length = 0;

        // for ... of construct.
        for (const x of s1) {
            out.push(x);
        }
        expect(out[0]).toBe(4);
        expect(out[1]).toBe(3);
        expect(out[2]).toBe(2);
        out.length = 0;

        // TODO: forEach method.
    });
    it('Proxy should properly handle length property', () => {
        const v1 = [1, 2, 3, 4];
        const s1 = swizzle(v1, [3, 2, 1]);
        expect(s1.length).toBe(3);

        const t = () => {
            s1.length = 4 as 3;
            console.debug(s1.length);
        }
        expect(t).toThrow(TypeError);
    });
});
