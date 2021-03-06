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

import { compileShader, linkShaderProgram } from './shaderProgram';

import worldVert from './shader/world.vert';
import worldFrag from './shader/world.frag';

export class WorldProgram {

    gl: WebGLRenderingContext;
    program: WebGLProgram;

    uProjection: WebGLUniformLocation;
    uView: WebGLUniformLocation;
    uTexture: WebGLUniformLocation;

    lPos: GLuint;
    lAtlasInfo: GLuint;
    lTexCoord: GLuint;
    lBright: GLuint;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        // 3D shader program, used for rendering walls, floors and ceilings.
        const vs = compileShader(gl, gl.VERTEX_SHADER, worldVert);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, worldFrag);
        this.program = linkShaderProgram(gl, [vs, fs]);

        // Use the newly-compiled shader program.
        gl.useProgram(this.program);

        // Projection matrix.
        const uProjection = gl.getUniformLocation(this.program, "uProjection");
        if (uProjection === null) {
            throw new Error('Could not find uProjection in world program');
        }
        this.uProjection = uProjection;
        // View matrix.
        const uView = gl.getUniformLocation(this.program, "uView");
        if (uView === null) {
            throw new Error('Could not find uView in world program');
        }
        this.uView = uView;
        // Texture atlas.
        const uTexture = gl.getUniformLocation(this.program, "uTexture");
        if (uTexture === null) {
            throw new Error('Could not find uTexture in world program');
        }
        this.uTexture = uTexture;

        // x, y, and z positions.
        this.lPos = gl.getAttribLocation(this.program, 'lPos');
        if (this.lPos === -1) {
            throw new Error('Could not find lPos in world program');
        }
        // u and v texture coordinates for the texture atlas.
        this.lAtlasInfo = gl.getAttribLocation(this.program, 'lAtlasInfo');
        if (this.lAtlasInfo === -1) {
            throw new Error('Could not find lAtlasInfo in world program');
        }
        // u and v texture coordinates for the texture itself.
        this.lTexCoord = gl.getAttribLocation(this.program, 'lTexCoord');
        if (this.lTexCoord === -1) {
            throw new Error('Could not find lTexCoord in world program');
        }
        // Brightness modifier.
        this.lBright = gl.getAttribLocation(this.program, 'lBright');
        if (this.lBright === -1) {
            throw new Error('Could not find lBright in world program');
        }

        // Don't accidentally mess with the program.
        gl.useProgram(null);
    }

    /**
     * Return the number of bytes needed to hold the given number of vertexes.
     * 
     * @param count Number of vertexes to measure.
     */
    static vertexBytes = (count: number) => {
        return count * 48;
    }

    /**
     * Write Vertex data to a buffer.
     * 
     * FIXME: Detect and deal with big-endian platforms...if they exist anymore.
     * 
     * @param buffer Destination buffer for vertex data.
     * @param index In a buffer that can hold multiple vertexes, the number
     *              of vertexes that come before (in the data) the vertex
     *              you want to write.
     */
    static setVertex = (
        buffer: ArrayBuffer, index: number, x: number, y: number, z: number,
        uAtOrigin: number, vAtOrigin: number, uAtLen: number, vAtLen: number,
        uTex: number, vTex: number, rBright: number, gBright: number,
        bBright: number
    ): ArrayBuffer => {
        const view = new DataView(
            buffer, WorldProgram.vertexBytes(index),
            WorldProgram.vertexBytes(1)
        );
        view.setFloat32(0, x, true);
        view.setFloat32(4, y, true);
        view.setFloat32(8, z, true);
        view.setFloat32(12, uAtOrigin, true);
        view.setFloat32(16, vAtOrigin, true);
        view.setFloat32(20, uAtLen, true);
        view.setFloat32(24, vAtLen, true);
        view.setFloat32(28, uTex, true);
        view.setFloat32(32, vTex, true);
        view.setFloat32(36, rBright, true);
        view.setFloat32(40, gBright, true);
        view.setFloat32(44, bBright, true);

        return buffer;
    }

    /**
     * Bind vertex attributes to the current GL buffers.
     */
    bindAttributes() {
        const gl = this.gl;
        const vertexLen = WorldProgram.vertexBytes(1);

        gl.enableVertexAttribArray(this.lPos);
        gl.vertexAttribPointer(this.lPos, 3, gl.FLOAT, false, vertexLen, 0);
        gl.enableVertexAttribArray(this.lAtlasInfo);
        gl.vertexAttribPointer(this.lAtlasInfo, 4, gl.FLOAT, false, vertexLen, 12);
        gl.enableVertexAttribArray(this.lTexCoord);
        gl.vertexAttribPointer(this.lTexCoord, 2, gl.FLOAT, false, vertexLen, 28);
        gl.enableVertexAttribArray(this.lBright);
        gl.vertexAttribPointer(this.lBright, 3, gl.FLOAT, false, vertexLen, 36);
    }

    /**
     * Unbind vertex attributes from the current buffers.
     */
    unbindAttributes() {
        const gl = this.gl;

        gl.disableVertexAttribArray(this.lPos);
        gl.disableVertexAttribArray(this.lAtlasInfo);
        gl.disableVertexAttribArray(this.lTexCoord);
        gl.disableVertexAttribArray(this.lBright);
    }
}

/**
 * Debugging function for vertex.
 */
(window as any).debugWorldVertex = (
    buffer: ArrayBuffer, index: number
): void => {
    const view = new DataView(
        buffer, WorldProgram.vertexBytes(index), WorldProgram.vertexBytes(1)
    );
    console.debug({
        x: view.getFloat32(0, true),
        y: view.getFloat32(4, true),
        z: view.getFloat32(8, true),
        uAtOrigin: view.getFloat32(12, true),
        vAtOrigin: view.getFloat32(16, true),
        uAtLen: view.getFloat32(20, true),
        vAtLen: view.getFloat32(24, true),
        uTex: view.getFloat32(28, true),
        vTex: view.getFloat32(32, true),
        rBright: view.getFloat32(36, true),
        gBright: view.getFloat32(40, true),
        bBright: view.getFloat32(44, true),
    });
}
