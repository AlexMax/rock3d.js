/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { glErrorString } from './util';

/**
 * Compile a shader safely, with a thrown exception if it doesn't compile
 * 
 * @param gl WebGL context
 * @param shaderType Shader type
 * @param source Source string
 */
export function compileShader(gl: WebGLRenderingContext, shaderType: number, source: string): WebGLShader {
    const shader = gl.createShader(shaderType);
    if (shader === null) {
        throw new Error('Could not create shader object');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const status: GLboolean = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (status === false) {
        const log = gl.getShaderInfoLog(shader);
        throw new Error(`${glErrorString(gl, shaderType)} compile error:\n${log}`);
    }

    return shader;
}

/**
 * Link shaders into a shader program safely, throwing an exception if linking
 * fails
 * 
 * @param gl WebGL context
 * @param shaders Compiled shaders to link
 */
export function linkShaderProgram(gl: WebGLRenderingContext, shaders: WebGLShader[]): WebGLProgram {
    const program = gl.createProgram();
    if (program === null) {
        throw new Error('Could not create program object');
    }

    for (let shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);

    const status: GLboolean = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (status === false) {
        const log = gl.getProgramInfoLog(program);
        throw new Error("Shader link error:\n" + log);
    }

    return program;
}
