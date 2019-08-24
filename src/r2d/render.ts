import { mat3, vec2 } from "gl-matrix";

import { Camera } from './camera';
import { LevelData, VertexCache } from '../leveldata';

export class RenderContext {
    ctx: CanvasRenderingContext2D;
    canvasProject: mat3;
    canvasProjectInv: mat3;

    constructor(canvas: HTMLCanvasElement) {
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
        const offset = vec2.fromValues(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
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
        ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    /**
     * Render a grid for the current level data.
     * 
     * @param cam Camera of the view.
     */
    renderGrid(cam: Camera): void {
        const ctx = this.ctx;
        const cameraMat = cam.getViewMatrix();

        const leftTop = vec2.fromValues(0, 0);
        const rightBottom = vec2.fromValues(ctx.canvas.width, ctx.canvas.height);
        this.screenToWorld(leftTop, leftTop, cam);
        this.screenToWorld(rightBottom, rightBottom, cam);

        // Stroke vertical lines.
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(57, 89, 111, 0.5)';

        for (let x = Math.round(leftTop[0] / 64) * 64;x < rightBottom[0];x += 64) {
            let v = vec2.fromValues(x, leftTop[1]);
            vec2.transformMat3(v, v, cameraMat);
            vec2.transformMat3(v, v, this.canvasProject);
            ctx.moveTo(v[0] + 0.5, v[1] + 0.5);
            vec2.set(v, x, rightBottom[1]);
            vec2.transformMat3(v, v, cameraMat);
            vec2.transformMat3(v, v, this.canvasProject);
            ctx.lineTo(v[0] + 0.5, v[1] + 0.5);
        }

        // Stroke horizontal lines.
        for (let y = Math.round(rightBottom[1] / 64) * 64;y < leftTop[1];y += 64) {
            let v = vec2.fromValues(leftTop[0], y);
            vec2.transformMat3(v, v, cameraMat);
            vec2.transformMat3(v, v, this.canvasProject);
            ctx.moveTo(v[0] + 0.5, v[1] + 0.5);
            vec2.set(v, rightBottom[0], y);
            vec2.transformMat3(v, v, cameraMat);
            vec2.transformMat3(v, v, this.canvasProject);
            ctx.lineTo(v[0] + 0.5, v[1] + 0.5);
        }

        ctx.stroke();
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
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'white';
        data.polygons.forEach((polygon) => {
            for (let i = 0;i < polygon.sides.length;i++) {
                const side = polygon.sides[i];
                const nextVert = polygon.sides[(i + 1) % polygon.sides.length].vertex;

                if (i === 0) {
                    let x = vec2.create();
                    vec2.transformMat3(x, side.vertex, cameraMat);
                    vec2.transformMat3(x, x, this.canvasProject);
                    ctx.moveTo(x[0] + 0.5, x[1] + 0.5);
                }

                let x = vec2.create();
                vec2.transformMat3(x, nextVert, cameraMat);
                vec2.transformMat3(x, x, this.canvasProject);
                ctx.lineTo(x[0] + 0.5, x[1] + 0.5);
            }
        });
        ctx.stroke();
    }

    /**
     * Given a cache of vertexes, render any visible ones.
     * 
     * @param vertexCache Cache of vertexes to render.
     */
    renderVertexCache(vertexCache: VertexCache, cam: Camera) {
        const ctx = this.ctx;
        const cameraMat = cam.getViewMatrix();

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgb(81, 168, 255)';
        vertexCache.forEach((cacheEntry) => {
            let x = vec2.create();
            vec2.transformMat3(x, cacheEntry.vertex, cameraMat);
            vec2.transformMat3(x, x, this.canvasProject);
            ctx.moveTo(x[0] - 1.5, x[1] - 1.5);
            ctx.lineTo(x[0] + 2.5, x[1] + 2.5);
            ctx.moveTo(x[0] - 1.5, x[1] + 2.5);
            ctx.lineTo(x[0] + 2.5, x[1] - 1.5);
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
    screenToWorld(outCoord: vec2, screenCoord: vec2, cam: Camera): vec2 {
        // Invert our camera matrix
        const cameraMatInv = cam.getViewMatrix();
        mat3.invert(cameraMatInv, cameraMatInv);

        // Un-project back to view coordinates.
        vec2.transformMat3(outCoord, screenCoord, this.canvasProjectInv);

        // Un-project back to world coordinates.
        vec2.transformMat3(outCoord, outCoord, cameraMatInv);

        return outCoord;
    }
}
