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

import { quat, vec2, vec3, vec4 } from 'gl-matrix';

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
    out[0] = Math.sqrt(x ** 2 + y ** 2);
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
 * Distance from origin to (x, y).
 *
 * @param x X coordinate.
 * @param y Y coordinate.
 */
export const distanceOrigin = (x: number, y: number): number => {
    return Math.sqrt(x ** 2 + y ** 2);
}

/**
 * Compute the point, if any, where two lines intersect.
 * 
 * @param out Output vector.
 * @param p First point of first line.
 * @param q Second point of first line.
 * @param r First point of second line.
 * @param s Second point of second line.
 */
export const intersectLines = (
    out: vec2, p: vec2, q: vec2, r: vec2, s: vec2
): vec2 | null => {
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
    vec2.set(out, p[0] + dx12 * t1, p[1] + dy12 * t1);
    return out;
}

/**
 * Compute the point, if any, where a line intersects a plane.
 * 
 * @param out Output vector.
 * @param p First point of line.
 * @param q Second point of line.
 * @param r A plane in the form of Ax + By + Cz + D = 0 where r is ABCD.
 */
export const intersectPlane = (
    out: vec3, p: vec3, q: vec3, r: vec4
): vec3 | null => {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const dz = q[2] - p[2];

    const denominator = r[0] * dx + r[1] * dy + r[2] * dz;
    if (denominator === 0) {
        return null;
    }

    const common = r[0] * p[0] + r[1] * p[1] + r[2] * p[2] + r[3];

    vec3.set(out,
        p[0] - ((dx * common) / denominator),
        p[1] - ((dy * common) / denominator),
        p[2] - ((dz * common) / denominator)
    );
    return out;
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
 * Check if point is inside circle.
 * 
 * @param p Point to check.
 * @param q Origin point of circle.
 * @param r Radius of circle.
 */
export const pointInCircle = (p: vec2, q: vec2, r: number): boolean => {
    return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 < r ** 2;
}

/**
 * Check if point is inside cube.
 * 
 * The two points on the rectangle can be passed using any orientation.
 */
export const pointInCube = (p: vec3, q: vec3, r: vec3): boolean => {
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

    if (q[2] < r[2]) {
        var minZ = q[2];
        var maxZ = r[2];
    } else {
        var maxZ = q[2];
        var minZ = r[2];
    }

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
 * @param p Origin point we're comparing against.
 * @param q Origin direction.  Note that the length of (p, q) is irrelevant,
 *          only the direction.
 * @param r Point we are checking.
 */
export const pointInDirection2 = (p: vec2, q: vec2, r: vec2): boolean => {
    if (q[0] > 0 && r[0] < p[0]) {
        return false; // Direction is +X, intersection is -X
    } else if (q[0] < 0 && r[0] > p[0]) {
        return false; // Direction is -X, intersection is +X
    }
    if (q[1] > 0 && r[1] < p[1]) {
        return false; // Direction is +Y, intersection is -Y
    } else if (q[1] < 0 && r[1] > p[1]) {
        return false; // Direction is -Y, intersection is +Y
    }
    return true;
}

/**
 * Figure out if a checked point is in the axis-aligned bounding box defined
 * by an origin point and direction.
 * 
 * @param p Origin point we're comparing against.
 * @param q Origin direction.  Note that the length of (p, q) is irrelevant,
 *          only the direction.
 * @param r Point we are checking.
 */
export const pointInDirection3 = (p: vec3, q: vec3, r: vec3): boolean => {
    if (q[0] > 0 && r[0] < p[0]) {
        return false; // Direction is +X, intersection is -X
    } else if (q[0] < 0 && r[0] > p[0]) {
        return false; // Direction is -X, intersection is +X
    }
    if (q[1] > 0 && r[1] < p[1]) {
        return false; // Direction is +Y, intersection is -Y
    } else if (q[1] < 0 && r[1] > p[1]) {
        return false; // Direction is -Y, intersection is +Y
    }
    if (q[2] > 0 && r[2] < p[2]) {
        return false; // Direction is +Z, intersection is -Z
    } else if (q[2] < 0 && r[2] > p[2]) {
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
 * @param q Origin point of rectangle. 
 * @param r Opposite point of rectangle.
 */
export const pointInRect = (p: vec2, q: vec2, r: vec2): boolean => {
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
 * @param p Origin point of rectangle.
 * @param q Opposite point of rectangle.
 * @param r Origin point of other rectangle.
 * @param s Opposite point of other rectangle.
 */
export const rectOverlap = (p: vec2, q: vec2, r: vec2, s: vec2): boolean => {
    if (p[0] < q[0]) {
        var aMinX = p[0];
        var aMaxX = q[0];
    } else {
        var aMaxX = p[0];
        var aMinX = q[0];
    }

    if (p[1] < q[1]) {
        var aMinY = p[1];
        var aMaxY = q[1];
    } else {
        var aMaxY = p[1];
        var aMinY = q[1];
    }

    if (r[0] < s[0]) {
        var bMinX = r[0];
        var bMaxX = s[0];
    } else {
        var bMaxX = r[0];
        var bMinX = s[0];
    }

    if (r[1] < s[1]) {
        var bMinY = r[1];
        var bMaxY = s[1];
    } else {
        var bMaxY = r[1];
        var bMinY = s[1];
    }

    if (aMinX >= bMaxX || aMaxX <= bMinX) {
        return false;
    }
    if (aMinY >= bMaxY || aMaxY <= bMinY) {
        return false;
    }

    return true;
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
 * @param p Quaternion to convert.
 */
export const toEuler = (out: vec3, p: quat): vec3 => {
    const xY = 2 * (p[3] * p[0] + p[1] * p[2]);
    const xX = 1 - 2 * (p[0] * p[0] + p[1] * p[1]);
    const xRad = Math.atan2(xY, xX);

    const yX = 2 * (p[3] * p[1] - p[2] * p[0]);
    if (yX >= 1) {
        var yRad = Math.PI / 2; // Clamp at 90 degrees.
    } else if (yX <= -1) {
        var yRad = -(Math.PI / 2); // Clamp at -90 degrees.
    } else {
        var yRad = Math.asin(yX);
    }

    const zY = 2 * (p[3] * p[2] + p[0] * p[1]);
    const zX = 1 - 2 * (p[1] * p[1] + p[2] * p[2]);
    const zRad = Math.atan2(zY, zX);

    // Convert to degrees.
    out[0] = xRad * (180 / Math.PI);
    out[1] = yRad * (180 / Math.PI);
    out[2] = zRad * (180 / Math.PI);

    return out;
}

/**
 * Turn a series of vertexes into a plane.
 * 
 * @param out Output vector.
 * @param p First point of plane.
 * @param q Second point of plane.
 * @param r Third point of plane.
 */
export const toPlane = (out: vec4, p: vec3, q: vec3, r: vec3): vec4 => {
    const AB = vec3.sub(vec3.create(), q, p);
    const AC = vec3.sub(vec3.create(), r, p);

    const cross = vec3.cross(vec3.create(), AB, AC);
    const w = -(cross[0] * p[0] + cross[1] * p[1] + cross[2] * p[2]);

    vec4.set(out, cross[0], cross[1], cross[2], w);
    return out;
}
