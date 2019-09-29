/**
 * rock3d.js: A 3D rendering engine with a retro heart.
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

import { glErrorString } from './util';

/**
 * Compile a shader safely, with a thrown exception if it doesn't compile
 * 
 * @param gl WebGL context
 * @param shaderType Shader type
 * @param source Source string
 */
export const compileShader = (
    gl: WebGLRenderingContext, shaderType: number, source: string
): WebGLShader => {
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
export const linkShaderProgram = (
    gl: WebGLRenderingContext, shaders: WebGLShader[]
): WebGLProgram => {
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
