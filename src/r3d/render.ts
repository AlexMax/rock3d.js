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

import { Atlas } from '../atlas';
import { AtlasTexture } from './atlasTexture';
import { Camera } from './camera';
import { DebugTextureContext } from './debug_texture';
import { WorldContext } from './worldContext';
import { WorldProgram } from './worldProgram';
import { FlatContext } from './flatContext';

const DEBUG: boolean = false;

export class RenderContext {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;

    worldProgram: WorldProgram;
    world: WorldContext;
    flat: FlatContext;
    debugTexture?: DebugTextureContext;

    worldAtlas?: Atlas;
    worldTexAtlas?: AtlasTexture;
    spriteAtlas?: Atlas;
    spriteTexAtlas?: AtlasTexture;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // Attach context to canvas element.
        const gl = canvas.getContext("webgl");
        if (gl === null) {
            throw new Error("WebGL could not be initialized");
        }
        this.gl = gl;

        // GL Settings.
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Set up shaders.
        this.worldProgram = new WorldProgram(gl);

        // Set up rendering contexts.
        this.world = new WorldContext(this);
        this.flat = new FlatContext(this);
        if (DEBUG === true) {
            this.debugTexture = new DebugTextureContext(this);
        }

        // Set projection matrix for initial settings.
        this.world.setProject(90);
        this.flat.setProject();
    }

    /**
     * Resize the canvas to the specified width and height.
     * 
     * @param width Desired width.
     * @param height Desired height.
     */
    resize(width: number, height: number): void {
        if (this.gl.canvas.width !== width ||
            this.gl.canvas.height !== height) {
            // Set the canvas internal width and height to the passed values.
            this.gl.canvas.width = width;
            this.gl.canvas.height = height;

            // Ensure that the viewport is the size of the buffer.
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

            // Fix up the projection matrix to match the new aspect ratio.
            this.world.setProject(90);
            this.flat.setProject();
        }
    }

    /**
     * Persist the texture atlas onto the GPU using the current render context.
     * 
     * @param textures Texture atlas to bake.
     */
    bakeTextureAtlas(textures: Atlas): void {
        // Set up atlas and texture into the render context
        this.worldAtlas = textures;
        this.worldTexAtlas = new AtlasTexture(this.gl, textures.length, 255);

        // Get the texture atlas onto the GPU
        textures.persist((data, x, y) => {
            if (this.worldTexAtlas === undefined) {
                throw new Error('World atlas texture is missing');
            }

            const gl = this.gl;
            gl.bindTexture(gl.TEXTURE_2D, this.worldTexAtlas.texture);

            // Corner pixels.
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x - 1, y - 1, gl.RGBA, gl.UNSIGNED_BYTE, data.img);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x + 1, y - 1, gl.RGBA, gl.UNSIGNED_BYTE, data.img);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x - 1, y + 1, gl.RGBA, gl.UNSIGNED_BYTE, data.img);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x + 1, y + 1, gl.RGBA, gl.UNSIGNED_BYTE, data.img);

            // Side walls.
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x - 1, y, gl.RGBA, gl.UNSIGNED_BYTE, data.img);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x + 1, y, gl.RGBA, gl.UNSIGNED_BYTE, data.img);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y - 1, gl.RGBA, gl.UNSIGNED_BYTE, data.img);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y + 1, gl.RGBA, gl.UNSIGNED_BYTE, data.img);

            // Actual texture.
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, data.img);

            gl.bindTexture(gl.TEXTURE_2D, null);
        });
    }

    /**
     * Persist the sprite atlas onto the GPU using the current render context.
     * 
     * @param sprites Sprite atlas to bake.
     */
    bakeSpriteAtlas(sprites: Atlas): void {
        // Set up atlas and texture into the render context
        this.spriteAtlas = sprites;
        this.spriteTexAtlas = new AtlasTexture(this.gl, sprites.length, 255);

        // Get the texture atlas onto the GPU
        sprites.persist((tex, x, y) => {
            if (this.spriteTexAtlas === undefined) {
                throw new Error('Sprite atlas texture is missing');
            }

            const gl = this.gl;

            // Actual sprite.
            gl.bindTexture(gl.TEXTURE_2D, this.spriteTexAtlas.texture);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, tex.img);
            gl.bindTexture(gl.TEXTURE_2D, null);
        });
    }

    render(cam: Camera): void {
        this.world.render(cam);
        this.flat.render();
        if (
            this.debugTexture !== undefined &&
            this.spriteAtlas !== undefined &&
            this.spriteTexAtlas !== undefined
        ) {
            this.debugTexture.render(this.spriteTexAtlas.texture);
        }
    }
}
