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

/**
 * Check if point is inside circle.
 * 
 * @param p Point to check.
 * @param q Origin point of circle.
 * @param r Radius of circle.
 */
export function pointInCircle(p: vec2, q: vec2, r: number): boolean {
    return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 < r ** 2;
}

/**
 * Check if point is inside rectangle.
 * 
 * The two points on the rectangle can be passed using any orientation.
 * 
 * @param p Point to check.
 * @param q Origin point of rectangle. 
 * @param r Opposite point of rectangle.
 */
export function pointInRect(p: vec2, q: vec2, r: vec2): boolean {
    if (q[0] < r[0]) {
        var minX = q[0];
        var maxX = r[0];
    } else {
        var maxX = q[0];
        var minX = r[0];
    }

    if (q[1] < r[1]) {
        var minY = q[1];
        var maxY = r[1];
    } else {
        var maxY = q[1];
        var minY = r[1];
    }

    if (p[0] < minX || p[0] > maxX) {
        return false;
    }
    if (p[1] < minY || p[1] > maxY) {
        return false;
    }
    return true;
}
