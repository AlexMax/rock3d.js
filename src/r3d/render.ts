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

import { Camera } from './camera';
import { DebugTextureContext } from './debug_texture';
import { WorldContext } from './world';

const DEBUG: boolean = false;

export class RenderContext {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;

    world: WorldContext;
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
        if (DEBUG === true) {
            this.debugTexture = new DebugTextureContext(this);
        }

        // Set projection matrix for initial settings.
        this.world.setProject(90);
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
