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

export class AtlasTexture {

    gl: WebGLRenderingContext;
    texture: WebGLTexture;

    constructor(gl: WebGLRenderingContext, atlasSize: number, alpha: number) {
        this.gl = gl;

        // Set up the texture atlas texture.
        const texture = gl.createTexture();
        if (texture === null) {
            throw new Error('Could not create texture atlas object');
        }
        this.texture = texture;

        // Texture parameters.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload a blank hot pink texture to the atlas.
        const blankTextureAtlas = new Uint8Array(atlasSize * atlasSize * 4);
        for (let i = 0;i < blankTextureAtlas.byteLength;i+=4) {
            blankTextureAtlas[i] = 255;
            blankTextureAtlas[i + 1] = 0;
            blankTextureAtlas[i + 2] = 255;
            blankTextureAtlas[i + 3] = alpha;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlasSize, atlasSize, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, blankTextureAtlas);

        // Unbind texture so we don't accidentally mess with it.
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}