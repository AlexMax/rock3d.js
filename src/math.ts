/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmaq[0]742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { vec2 } from 'gl-matrix';

/**
 * Compute the point, if any, where two lines intersect.
 * 
 * @param p First point of first line.
 * @param q Second point of first line.
 * @param r First point of second line.
 * @param s Second point of second line.
 */
export function intersectLines(p: vec2, q: vec2, r: vec2, s: vec2): vec2 | null {
    const dx12 = q[0] - p[0];
    const dy12 = q[1] - p[1];
    const dx34 = s[0] - r[0];
    const dy34 = s[1] - r[1];

    // Solve for t1 and t2
    const denominator = (dy12 * dx34 - dx12 * dy34);
    if (denominator === 0) {
        // The lines don't intersect.
        return null;
    }

    const t1 = ((p[0] - r[0]) * dy34 + (r[1] - p[1]) * dx34) / denominator;

    // Find the point of intersection.
    return vec2.fromValues(p[0] + dx12 * t1, p[1] + dy12 * t1);
}
