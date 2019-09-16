/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

/**
 * Turn a WebGL GLenum into a string, for debugging purposes.
 * 
 * @param gl WebGL rendering context, which contains the enumerations.
 * @param num The enumeration to stringify.
 */
export function glErrorString(gl: WebGLRenderingContext, num: GLenum): string {
    switch (num) {
    case gl.VERTEX_SHADER:
        return 'VERTEX_SHADER';
    case gl.FRAGMENT_SHADER:
        return 'FRAGMENT_SHADER';
    default:
        return '(unknown)';
    }
}
