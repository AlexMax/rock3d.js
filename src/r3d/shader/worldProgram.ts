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

import { compileShader, linkShaderProgram } from '../shaderProgram';

import worldVert from './world.vert';
import worldFrag from './world.frag';

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
