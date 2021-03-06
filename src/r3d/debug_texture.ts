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

import { RenderContext } from './render';
import { compileShader, linkShaderProgram } from './shaderProgram';

import debug_texture_vert from './shader/debug_texture.vert';
import debug_texture_frag from './shader/debug_texture.frag';

export class DebugTextureContext {
    parent: RenderContext; // Reference to parent
    debugProg: WebGLProgram;
    debugVBO: WebGLBuffer;
    debug_lPos: GLuint;
    debug_lTex: GLuint;

    constructor(parent: RenderContext) {
        this.parent = parent;
        const gl = parent.gl;

        // Debug shader program, which simply renders a texture to screen.
        const vs = compileShader(gl, gl.VERTEX_SHADER, debug_texture_vert);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, debug_texture_frag);
        this.debugProg = linkShaderProgram(gl, [vs, fs]);

        // We need a vertex buffer...
        const vbo = gl.createBuffer();
        if (vbo === null) {
            throw new Error('Could not allocate debugVBO');
        }
        this.debugVBO = vbo;

        // Layout of our vertexes, as passed to the vertex shader.
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        // x, y and z positions.
        this.debug_lPos = gl.getAttribLocation(this.debugProg, 'lPos');
        if (this.debug_lPos === -1) {
            throw new Error('Could not find lPos in debug program');
        }
        // u and v texture coords.
        this.debug_lTex = gl.getAttribLocation(this.debugProg, 'lTex');
        if (this.debug_lTex === -1) {
            throw new Error('Could not find lTex in debug program');
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null); // So we don't modify the buffer

        // Assign the texture to the debug program.
        gl.useProgram(this.debugProg);
        const textureLoc = gl.getUniformLocation(this.debugProg, "uTexture");
        if (textureLoc === null) {
            throw new Error('uTexture uniform location could not be found');
        }
        gl.uniform1i(textureLoc, 0);
    }

    render(texture: WebGLTexture) {
        const gl = this.parent.gl;

        // Render our texture atlas to screen.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.useProgram(this.debugProg);

        const dVertexLen = 20;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.debugVBO);
        const vertexes = Float32Array.from([
            0.0, 0.0, 0.0, 1.0, 1.0,
            0.0, 1.0, 0.0, 1.0, 0.0,
            -1.0, 0.0, 0.0, 0.0, 1.0,
            -1.0, 1.0, 0.0, 0.0, 0.0
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertexes, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.debug_lPos);
        gl.vertexAttribPointer(this.debug_lPos, 3, gl.FLOAT, false, dVertexLen, 0);
        gl.enableVertexAttribArray(this.debug_lTex);
        gl.vertexAttribPointer(this.debug_lTex, 2, gl.FLOAT, false, dVertexLen, 12);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.disableVertexAttribArray(this.debug_lPos);
        gl.disableVertexAttribArray(this.debug_lTex);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}
