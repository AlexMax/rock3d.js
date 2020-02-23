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

import { mat3, vec2 } from "gl-matrix";

import { Camera, cameraGetViewMatrix } from './camera';
import { Level } from '../level';

/**
 * Round a coordinate to the nearest x.5, so the coordinate comes out "crisp".
 * 
 * @param coord Coordinate to round.
 */
const crisp = (coord: number) => {
    return Math.round(coord) + 0.5;
}

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
     * Resize the canvas to the specified width and height.
     * 
     * Note that these are canvas units, which may not mirror the actual
     * width and height of the canvas on the page.
     * 
     * @param width Desired width.
     * @param height Desired height.
     */
    resize(width: number, height: number) {
        if (this.ctx.canvas.width !== width ||
            this.ctx.canvas.height !== height) {
            this.ctx.canvas.width = width;
            this.ctx.canvas.height = height;
            this.setProject();
        }
    }

    /**
     * Given the current canvas width and height, set up projection matrix.
     */
    setProject() {
        const offset = vec2.fromValues(
            this.ctx.canvas.clientWidth / 2,
            this.ctx.canvas.clientHeight / 2);
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
        ctx.fillRect(0, 0, this.ctx.canvas.clientWidth, this.ctx.canvas.clientHeight);
    }

    /**
     * Render a grid for the current level data.
     * 
     * @param cam Camera of the view.
     */
    renderGrid(cam: Camera, size: number): void {
        const ctx = this.ctx;
        const cameraMat = cameraGetViewMatrix(cam);

        const leftTop = vec2.fromValues(0, 0);
        const rightBottom = vec2.fromValues(ctx.canvas.clientWidth, ctx.canvas.clientHeight);
        this.screenToWorld(leftTop, leftTop, cam);
        this.screenToWorld(rightBottom, rightBottom, cam);

        const gridLines: vec2[] = [];
        const gridLines64: vec2[] = [];

        // Vertical lines.
        for (let x = Math.round(leftTop[0] / size) * size;x < rightBottom[0];x += size) {
            const v1 = vec2.fromValues(x, leftTop[1]);
            vec2.transformMat3(v1, v1, cameraMat);
            vec2.transformMat3(v1, v1, this.canvasProject);
            const v2 = vec2.fromValues(x, rightBottom[1]);
            vec2.transformMat3(v2, v2, cameraMat);
            vec2.transformMat3(v2, v2, this.canvasProject);

            if (x % 64 === 0) {
                gridLines64.push(v1);
                gridLines64.push(v2);
            } else {
                gridLines.push(v1);
                gridLines.push(v2);
            }
        }

        // Stroke horizontal lines.
        for (let y = Math.round(rightBottom[1] / size) * size;y < leftTop[1];y += size) {
            const v1 = vec2.fromValues(leftTop[0], y);
            vec2.transformMat3(v1, v1, cameraMat);
            vec2.transformMat3(v1, v1, this.canvasProject);
            const v2 = vec2.fromValues(rightBottom[0], y);
            vec2.transformMat3(v2, v2, cameraMat);
            vec2.transformMat3(v2, v2, this.canvasProject);

            if (y % 64 === 0) {
                gridLines64.push(v1);
                gridLines64.push(v2);
            } else {
                gridLines.push(v1);
                gridLines.push(v2);
            }
        }

        // Stroke our normal lines.
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(70, 70, 70, 0.5)';
        for (let i = 0;i < gridLines.length;i += 2) {
            ctx.moveTo(crisp(gridLines[i][0]), crisp(gridLines[i][1]));
            ctx.lineTo(crisp(gridLines[i + 1][0]), crisp(gridLines[i + 1][1]));
        }
        ctx.stroke();

        // Stroke our 64 lines.
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(57, 89, 111, 0.5)';
        for (let i = 0;i < gridLines64.length;i += 2) {
            ctx.moveTo(crisp(gridLines64[i][0]), crisp(gridLines64[i][1]));
            ctx.lineTo(crisp(gridLines64[i + 1][0]), crisp(gridLines64[i + 1][1]));
        }
        ctx.stroke();
    }

    /**
     * Render level data.
     * 
     * @param level Level data to render.
     * @param cam Camera of the view.
     */
    renderLevel(level: Level, cam: Camera): void {
        const ctx = this.ctx;
        const cameraMat = cameraGetViewMatrix(cam);

        // Draw two-sided edges first.
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'grey';
        level.polygons.forEach((polygon) => {
            for (let i = 0;i < polygon.edgeIDs.length;i++) {
                const edge = level.edges[polygon.edgeIDs[i]];
                if (edge.backPoly === null) {
                    // Skip edges with no backPoly for now.
                    const v = vec2.create();
                    vec2.transformMat3(v, edge.nextVertex, cameraMat);
                    vec2.transformMat3(v, v, this.canvasProject);
                    ctx.moveTo(crisp(v[0]), crisp(v[1]));
                    continue;
                }

                if (i === 0) {
                    const v = vec2.create();
                    vec2.transformMat3(v, edge.vertex, cameraMat);
                    vec2.transformMat3(v, v, this.canvasProject);
                    ctx.moveTo(crisp(v[0]), crisp(v[1]));
                }

                const v = vec2.create();
                vec2.transformMat3(v, edge.nextVertex, cameraMat);
                vec2.transformMat3(v, v, this.canvasProject);
                ctx.lineTo(crisp(v[0]), crisp(v[1]));
            }
        });
        ctx.stroke();

        // Draw one-sided edges on top.
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'white';
        level.polygons.forEach((polygon) => {
            for (let i = 0;i < polygon.edgeIDs.length;i++) {
                const edge = level.edges[polygon.edgeIDs[i]];
                if (edge.backPoly !== null) {
                    // We already drew edges with a backPoly.
                    const v = vec2.create();
                    vec2.transformMat3(v, edge.nextVertex, cameraMat);
                    vec2.transformMat3(v, v, this.canvasProject);
                    ctx.moveTo(crisp(v[0]), crisp(v[1]));
                    continue;
                }

                if (i === 0) {
                    const v = vec2.create();
                    vec2.transformMat3(v, edge.vertex, cameraMat);
                    vec2.transformMat3(v, v, this.canvasProject);
                    ctx.moveTo(crisp(v[0]), crisp(v[1]));
                }

                const v = vec2.create();
                vec2.transformMat3(v, edge.nextVertex, cameraMat);
                vec2.transformMat3(v, v, this.canvasProject);
                ctx.lineTo(crisp(v[0]), crisp(v[1]));
            }
        });
        ctx.stroke();
    }

    /**
     * Render all locations in a level.
     * 
     * @param level Level to render locations from.
     * @param cam Camera position to render from.
     */
    renderLocations(level: Level, cam: Camera): void {
        const ctx = this.ctx;
        const cameraMat = cameraGetViewMatrix(cam);

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgb(190, 255, 159)';
        level.locations.forEach((location) => {
            // Calculate circle location.
            const c = vec2.create();
            vec2.transformMat3(c, location.position, cameraMat);
            vec2.transformMat3(c, c, this.canvasProject);

            // Calculate circle radius.
            const r = vec2.fromValues(
                location.position[0] + 16, location.position[1],
            );
            vec2.transformMat3(r, r, cameraMat);
            vec2.transformMat3(r, r, this.canvasProject);
            const rad = vec2.dist(c, r);

            // Draw the circle.
            ctx.moveTo(crisp(c[0]), crisp(c[1]));
            ctx.arc(crisp(c[0]), crisp(c[1]), rad, 0, 2 * Math.PI);
        });
        ctx.stroke();
    }

    /**
     * Given an array of vertexes, render lines between them.  Vertexes
     * are shared between the ending of one line and start of another.
     * 
     * @param vertexes Array of vertexes of lines to render.
     */
    renderLines(vertexes: vec2[], cam: Camera, style: string) {
        if (vertexes.length < 2) {
            // We can't render a line with less than two vertexes.
            return;
        }

        const ctx = this.ctx;
        const cameraMat = cameraGetViewMatrix(cam);

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = style;

        for (let i = 1;i < vertexes.length;i += 1) {
            if (i === 1) {
                // Move to the origin vertex.
                let o = vec2.create();
                vec2.transformMat3(o, vertexes[i - 1], cameraMat);
                vec2.transformMat3(o, o, this.canvasProject);
                ctx.moveTo(crisp(o[0]), crisp(o[1]));
            }

            // Draw to the next vertex.
            let v = vec2.create();
            vec2.transformMat3(v, vertexes[i], cameraMat);
            vec2.transformMat3(v, v, this.canvasProject);
            ctx.lineTo(crisp(v[0]), crisp(v[1]));
        }
        ctx.stroke();
    }

    /**
     * Given an array of vertexes, render all of them.
     * 
     * @param vertexes Array of vertexes to render.
     */
    renderVertexes(vertexes: vec2[], cam: Camera, style: string) {
        const ctx = this.ctx;
        const cameraMat = cameraGetViewMatrix(cam);

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = style;
        vertexes.forEach((vertex) => {
            let v = vec2.create();
            vec2.transformMat3(v, vertex, cameraMat);
            vec2.transformMat3(v, v, this.canvasProject);
            ctx.moveTo(crisp(v[0] - 2), crisp(v[1] - 2));
            ctx.lineTo(crisp(v[0] + 2), crisp(v[1] + 2));
            ctx.moveTo(crisp(v[0] - 2), crisp(v[1] + 2));
            ctx.lineTo(crisp(v[0] + 2), crisp(v[1] - 2));
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
        const cameraMatInv = cameraGetViewMatrix(cam);
        mat3.invert(cameraMatInv, cameraMatInv);

        // Un-project back to view coordinates.
        vec2.transformMat3(outCoord, screenCoord, this.canvasProjectInv);

        // Un-project back to world coordinates.
        vec2.transformMat3(outCoord, outCoord, cameraMatInv);

        return outCoord;
    }
}
