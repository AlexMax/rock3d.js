/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { Camera } from './camera';
import { DebugTextureContext } from './debug_texture';
import { SpriteContext } from './sprite';
import { WorldContext } from './world';

const DEBUG: boolean = false;

export class RenderContext {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;

    world: WorldContext;
    sprite: SpriteContext;
    debugTexture?: DebugTextureContext;

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

        this.world = new WorldContext(this);
        this.sprite = new SpriteContext(this);
        if (DEBUG === true) {
            this.debugTexture = new DebugTextureContext(this);
        }
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
        }
    }

    render(cam: Camera): void {
        this.world.render(cam);
        if (this.debugTexture !== undefined && this.world.worldAtlas !== undefined) {
            this.debugTexture.render(this.world.worldTexAtlas);
        }
    }
}
