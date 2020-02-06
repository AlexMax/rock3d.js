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

import { ArrayTypes, glMatrix, quat, vec2, vec3, vec4 } from 'gl-matrix';

/**
 * Polar coordinates as radius, angle (in radians) pair.
 */
type polar = [number, number];

/**
 * Return a random array value.
 * 
 * @param array Array to return value from.
 */
export const arrayRandom = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Convert cartesian to polar coordinates.
 */
export const cartesianToPolar = (out: polar, x: number, y: number): polar => {
    out[0] = Math.hypot(x, y);
    out[1] = Math.atan2(y, x);
    return out;
}

/**
 * Constrain a number between two bounds.
 * 
 * @param x Number to constrain.
 * @param min Minimum bound.
 * @param max Maximum bound.
 */
export const constrain = (x: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, x));
}

/**
 * Detect where on a line a circle is touching.
 * 
 * Returns the point on the line where the circle is touching it, or null
 * if the circle does not touch the line.
 * 
 * @param out Output vector.  Only updated if circle touches line.
 * @param a First vertex of line.
 * @param b Second vertex of line.
 * @param c Point of circle.
 * @param r Radius of circle.
 */
export const circleTouchesLine = (
    out: vec2, a: vec2, b: vec2, c: vec2, r: number
): vec2 | null => {
    // First we must get the length of the line.
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);

    // Intermediate step to finding closest point on the line.
    const R = (((c[0] - a[0]) * (b[0] - a[0])) + ((c[1] - a[1]) * (b[1] - a[1]))) / L ** 2;

    // Actually find the closest point on the line
    const Px = a[0] + (R * (b[0] - a[0]));
    const Py = a[1] + (R * (b[1] - a[1]));

    // Check to see if the closest point is on the line segment.
    if (
        Px <= Math.min(a[0], b[0]) - r ||
        Px >= Math.max(a[0], b[0]) + r ||
        Py <= Math.min(a[1], b[1]) - r ||
        Py >= Math.max(a[1], b[1]) + r
    ) {
        return null;
    }

    // Figure out if our circle is close enough to actually touch the line.
    const dist = Math.hypot(Px - c[0], Py - c[1]);
    if (dist > r || glMatrix.equals(dist, r)) {
        return null;
    }

    // We have our point.
    out[0] = Px;
    out[1] = Py;
    return out;
}

/**
 * Compute the point, if any, where two lines intersect.
 * 
 * @param out Output vector.
 * @param a First point of first line.
 * @param b Second point of first line.
 * @param c First point of second line.
 * @param d Second point of second line.
 */
export const intersectLines = (
    out: vec2, a: vec2, b: vec2, c: vec2, d: vec2
): vec2 | null => {
    const dxab = b[0] - a[0];
    const dyab = b[1] - a[1];
    const dxcd = d[0] - c[0];
    const dycd = d[1] - c[1];

    // Solve for t1 and t2
    const denominator = dyab * dxcd - dxab * dycd;
    if (denominator === 0) {
        // The lines don't intersect.
        return null;
    }

    const t = ((a[0] - c[0]) * dycd + (c[1] - a[1]) * dxcd) / denominator;

    // Find the point of intersection.
    vec2.set(out, a[0] + dxab * t, a[1] + dyab * t);
    return out;
}

/**
 * Compute the point, if any, where a line intersects a plane.
 * 
 * @param out Output vector.
 * @param a First point of line.
 * @param b Second point of line.
 * @param P A plane in the form of Ax + By + Cz + D = 0 where r is ABCD.
 */
export const intersectPlane = (
    out: vec3, a: vec3, b: vec3, P: vec4
): vec3 | null => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];

    const denominator = P[0] * dx + P[1] * dy + P[2] * dz;
    if (denominator === 0) {
        return null;
    }

    const common = P[0] * a[0] + P[1] * a[1] + P[2] * a[2] + P[3];

    vec3.set(out,
        a[0] - ((dx * common) / denominator),
        a[1] - ((dy * common) / denominator),
        a[2] - ((dz * common) / denominator)
    );
    return out;
}

/**
 * Check if point is inside circle.
 * 
 * @param a Point to check.
 * @param b Origin point of circle.
 * @param r Radius of circle.
 */
export const pointInCircle = (a: vec2, b: vec2, r: number): boolean => {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 < r ** 2;
}

/**
 * Check if point is inside cube.
 * 
 * The two points on the rectangle can be passed using any orientation.
 * 
 * @param p Point to check.
 * @param a Origin point of cube.
 * @param b Opposite point of cube.
 */
export const pointInCube = (p: vec3, a: vec3, b: vec3): boolean => {
    const minX = Math.min(a[0], b[0]);
    const maxX = Math.max(a[0], b[0]);
    const minY = Math.min(a[1], b[1]);
    const maxY = Math.max(a[1], b[1]);
    const minZ = Math.min(a[2], b[2]);
    const maxZ = Math.max(a[2], b[2]);

    if (p[0] < minX || p[0] > maxX) {
        return false;
    }
    if (p[1] < minY || p[1] > maxY) {
        return false;
    }
    if (p[2] < minZ || p[2] > maxZ) {
        return false;
    }

    return true;
}

/**
 * Figure out if a checked point is in the axis-aligned bounding box defined
 * by an origin point and direction.
 * 
 * @param a Origin point we're comparing against.
 * @param b Origin direction.  Note that the length of (p, q) is irrelevant,
 *          only the direction.
 * @param p Point we are checking.
 */
export const pointInDirection2 = (a: vec2, b: vec2, p: vec2): boolean => {
    if (b[0] > 0 && p[0] < a[0]) {
        return false; // Direction is +X, intersection is -X
    } else if (b[0] < 0 && p[0] > a[0]) {
        return false; // Direction is -X, intersection is +X
    }
    if (b[1] > 0 && p[1] < a[1]) {
        return false; // Direction is +Y, intersection is -Y
    } else if (b[1] < 0 && p[1] > a[1]) {
        return false; // Direction is -Y, intersection is +Y
    }
    return true;
}

/**
 * Figure out if a checked point is in the axis-aligned bounding box defined
 * by an origin point and direction.
 * 
 * @param a Origin point we're comparing against.
 * @param b Origin direction.  Note that the length of (p, q) is irrelevant,
 *          only the direction.
 * @param p Point we are checking.
 */
export const pointInDirection3 = (a: vec3, b: vec3, p: vec3): boolean => {
    if (b[0] > 0 && p[0] < a[0]) {
        return false; // Direction is +X, intersection is -X
    } else if (b[0] < 0 && p[0] > a[0]) {
        return false; // Direction is -X, intersection is +X
    }
    if (b[1] > 0 && p[1] < a[1]) {
        return false; // Direction is +Y, intersection is -Y
    } else if (b[1] < 0 && p[1] > a[1]) {
        return false; // Direction is -Y, intersection is +Y
    }
    if (b[2] > 0 && p[2] < a[2]) {
        return false; // Direction is +Z, intersection is -Z
    } else if (b[2] < 0 && p[2] > a[2]) {
        return false; // Direction is -Z, intersection is +Z
    }
    return true;
}

/**
 * Check if point is inside rectangle.
 * 
 * The two points on the rectangle can be passed using any orientation.
 * 
 * @param p Point to check.
 * @param a Origin point of rectangle. 
 * @param b Opposite point of rectangle.
 */
export const pointInRect = (p: vec2, a: vec2, b: vec2): boolean => {
    const minX = Math.min(a[0], b[0]);
    const maxX = Math.max(a[0], b[0]);
    const minY = Math.min(a[1], b[1]);
    const maxY = Math.max(a[1], b[1]);

    if (p[0] < minX || p[0] > maxX) {
        return false;
    }
    if (p[1] < minY || p[1] > maxY) {
        return false;
    }

    return true;
}

/**
 * Convert polar to cartesian coordinates.
 *
 * @param out Output vector.
 * @param radius Radius coordinate.
 * @param theta Angle coordinate in radians.
 */
export const polarToCartesian = <T extends vec2 | vec3>(
    out: T, radius: number, theta: number
): T => {
    out[0] = radius * Math.cos(theta);
    out[1] = radius * Math.sin(theta);
    return out;
}

/**
 * Check if rectangle is partly overlapping another rectangle.
 *
 * @param a Origin point of rectangle.
 * @param b Opposite point of rectangle.
 * @param c Origin point of other rectangle.
 * @param d Opposite point of other rectangle.
 */
export const rectOverlap = (a: vec2, b: vec2, c: vec2, d: vec2): boolean => {
    const abMinX = Math.min(a[0], b[0]);
    const abMaxX = Math.max(a[0], b[0]);
    const abMinY = Math.min(a[1], b[1]);
    const abMaxY = Math.max(a[1], b[1]);
    const cdMinX = Math.min(c[0], d[0]);
    const cdMaxX = Math.max(c[0], d[0]);
    const cdMinY = Math.min(c[1], d[1]);
    const cdMaxY = Math.max(c[1], d[1]);

    if (abMinX >= cdMaxX || abMaxX <= cdMinX) {
        return false;
    }
    if (abMinY >= cdMaxY || abMaxY <= cdMinY) {
        return false;
    }

    return true;
}

/**
 * Round a number to the nearest multiple.
 * 
 * @param num Number to round.
 * @param multi Multiple to round by.
 */
export const roundMultiple = (num: number, multi: number): number => {
    return Math.round(num / multi) * multi;
}

/**
 * Convert spherical coordinates to cartesian coordinates.
 * 
 * @param out Output vector.
 * @param radius Radius of sphere.
 * @param phi Parallel angle in radians.
 * @param theta Meridian angle in radians.
 */
export const sphereToCartesian = (
    out: vec3, radius: number, phi: number, theta: number
): vec3 => {
    const sinPhi = Math.sin(phi);
    out[0] = radius * sinPhi * Math.cos(theta);
    out[1] = radius * sinPhi * Math.sin(theta);
    out[2] = radius * Math.cos(phi);
    return out;
}

/**
 * Convert quaternion to euler angles.
 *
 * @param out Output vector.
 * @param q Quaternion to convert.
 */
export const quatToEuler = (out: vec3, q: quat): vec3 => {
    const xY = 2 * (q[3] * q[0] + q[1] * q[2]);
    const xX = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    const xRad = Math.atan2(xY, xX);

    const yX = 2 * (q[3] * q[1] - q[2] * q[0]);
    const yRad =
        (yX >= 1) ? Math.PI / 2 : // Clamp at 90 degrees.
        (yX <= -1) ? -(Math.PI / 2) : // Clamp at -90 degrees.
        Math.asin(yX);

    const zY = 2 * (q[3] * q[2] + q[0] * q[1]);
    const zX = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
    const zRad = Math.atan2(zY, zX);

    // Convert to degrees.
    out[0] = xRad * (180 / Math.PI);
    out[1] = yRad * (180 / Math.PI);
    out[2] = zRad * (180 / Math.PI);

    return out;
}

/**
 * Quantize a array of numbers to some reduced precision.
 * 
 * @param out Output array.
 * @param a Input array.
 */
export const quantize = <T extends ArrayTypes>(out: T, a: Readonly<T>): T => {
    for (let i = 0;i < a.length;i++) {
        if (glMatrix.equals(a[i], 0.0)) {
            out[i] = 0;
        } else {
            out[i] = a[i];
        }
    }
    return out;
}

/**
 * Turn a series of vertexes into a plane.
 * 
 * @param out Output vector.
 * @param a First point of plane.
 * @param b Second point of plane.
 * @param c Third point of plane.
 */
export const toPlane = (out: vec4, a: vec3, b: vec3, c: vec3): vec4 => {
    const AB = vec3.sub(vec3.create(), b, a);
    const AC = vec3.sub(vec3.create(), c, a);

    const cross = vec3.cross(vec3.create(), AB, AC);
    const w = -(cross[0] * a[0] + cross[1] * a[1] + cross[2] * a[2]);

    vec4.set(out, cross[0], cross[1], cross[2], w);
    return out;
}
