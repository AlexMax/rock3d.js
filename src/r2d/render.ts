import { mat3, vec2 } from "gl-matrix";

import { Camera } from './camera';
import { LevelData } from '../leveldata';

export class RenderContext {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    canvasPoject: mat3;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // Attach context to canvas element.
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx === null) {
            throw new Error('Canvas2D could not be initialized');
        }
        this.ctx = ctx;

        // Set up the canvas projection.
        this.canvasPoject = mat3.create();
        this.setProject();
    }

    /**
     * Given the current canvas width and height, set up projection matrix.
     * 
     * Run this method anytime the canvas width and height change, so we
     * know where the center of the view is.
     */
    setProject() {
        const offset = vec2.fromValues(this.canvas.width / 2, this.canvas.height / 2);
        mat3.fromTranslation(this.canvasPoject, offset);
        this.canvasPoject[4] *= -1; // invert y-axis
    }

    /**
     * Render a grid for the current level data.
     * 
     * @param cam Camera of the view.
     */
    renderGrid(cam: Camera): void {
        const ctx = this.ctx;
        const cameraMat = cam.getViewMatrix();

        // TODO: Implement, we shouldn't render grid lines for things we
        //       can't see.
    }

    /**
     * Render level data.
     * 
     * @param data Level data to render.
     * @param cam Camera of the view.
     */
    renderLevel(data: LevelData, cam: Camera): void {
        const ctx = this.ctx;
        const cameraMat = cam.getViewMatrix();

        ctx.beginPath();
        ctx.strokeStyle = 'white';
        data.polygons.forEach((polygon) => {
            for (let i = 0;i < polygon.sides.length;i++) {
                const side = polygon.sides[i];
                const nextVert = polygon.sides[(i + 1) % polygon.sides.length].vertex;

                if (i === 0) {
                    let x = vec2.create();
                    vec2.transformMat3(x, side.vertex, cameraMat);
                    vec2.transformMat3(x, x, this.canvasPoject);
                    ctx.moveTo(x[0], x[1]);
                }

                let x = vec2.create();
                vec2.transformMat3(x, nextVert, cameraMat);
                vec2.transformMat3(x, x, this.canvasPoject);
                ctx.lineTo(x[0], x[1]);
            }
        });
        ctx.stroke();
    }
}
