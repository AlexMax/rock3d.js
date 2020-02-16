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