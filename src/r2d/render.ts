import { mat3, vec2 } from "gl-matrix";

import { Camera } from './camera';
import { LevelData } from '../leveldata';

export class RenderContext {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    canvasProject: mat3;
    canvasProjectInv: mat3;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // Attach context to canvas element.
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx === null) {
            throw new Error('Canvas2D could not be initialized');
        }
        this.ctx = ctx;

        // Set up the canvas projection.
        this.canvasProject = mat3.create();
        this.canvasProjectInv = mat3.create();
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
        mat3.fromTranslation(this.canvasProject, offset);
        this.canvasProject[4] *= -1; // invert y-axis
        mat3.invert(this.canvasProjectInv, this.canvasProject);
    }

    /**
     * Clear the screen.
     */
    clear(): void {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
                    vec2.transformMat3(x, x, this.canvasProject);
                    ctx.moveTo(x[0], x[1]);
                }

                let x = vec2.create();
                vec2.transformMat3(x, nextVert, cameraMat);
                vec2.transformMat3(x, x, this.canvasProject);
                ctx.lineTo(x[0], x[1]);
            }
        });
        ctx.stroke();
    }

    /**
     * Given an x and y coordinate on the screen (canvas), go back to world
     * (level) coordinates.
     * 
     * @param screenCoord Screen coordinates.
     * @param cam Camera to use for reverse projection.
     */
    screenToWorld(screenCoord: vec2, cam: Camera): vec2 {
        const coord = vec2.create();

        // Invert our camera matrix
        const cameraMatInv = cam.getViewMatrix();
        mat3.invert(cameraMatInv, cameraMatInv);

        // Un-project back to view coordinates.
        vec2.transformMat3(coord, screenCoord, this.canvasProjectInv);

        // Un-project back to world coordinates.
        vec2.transformMat3(coord, coord, cameraMatInv);

        return coord;
    }
}
