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

import { mat4, vec3 } from "gl-matrix";

import { createCamera, getViewMatrix } from "./camera";
import { RenderContext } from "./render";
import { WorldProgram } from "./worldProgram";

export class FlatContext {
    parent: RenderContext; // Reference to parent

    project: mat4;

    weaponVerts: ArrayBuffer;
    weaponVertCount: number;
    weaponInds: Uint16Array;
    weaponIndCount: number;

    vbo: WebGLBuffer;
    ebo: WebGLBuffer;

    constructor(parent: RenderContext) {
        this.parent = parent;
        const gl = parent.gl;

        // Projection matrix.
        this.project = mat4.create();

        // Weapon vertexes and indexes.
        this.weaponVerts = new ArrayBuffer(32768);
        this.weaponVertCount = 0;
        this.weaponInds = new Uint16Array(1024);
        this.weaponIndCount = 0;

        // We need vertex buffers...
        const vbo = gl.createBuffer();
        if (vbo === null) {
            throw new Error('Could not allocate worldVBO');
        }
        this.vbo = vbo;

        // ...and index buffers...
        const ebo = gl.createBuffer();
        if (ebo === null) {
            throw new Error('Could not allocate worldEBO');
        }
        this.ebo = ebo;
    }

    /**
     * Set up the projection matrix for the given FOV.
     * 
     * @param fov FOV in degrees.
     */
    setProject(): void {
        const gl = this.parent.gl;
        const canvas = gl.canvas as HTMLCanvasElement;

        const virtualHeight = 240;
        const virtualWidth = (canvas.clientWidth * virtualHeight) / canvas.clientHeight;

        mat4.ortho(
            this.project, -(virtualWidth / 2), virtualWidth / 2,
            virtualHeight / 2, -(virtualHeight / 2), -1, 1
        );
    }

    addWeapon(frame: string): void {
        const sprPrefix = 'SHT2';

        if (this.parent.spriteAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Weapon sprites never have rotations, try the default rotation.
        const texEntry = this.parent.spriteAtlas.find(sprPrefix + frame + '0');
        if (texEntry === null) {
            throw new Error(`Unknown sprite ${texEntry}`);
        }

        // Sprite position
        const xHalf = texEntry.texture.img.width / 2;
        const yHalf = texEntry.texture.img.height / 2;
        const xOffset = xHalf - texEntry.texture.info.xCenter;
        const yOffset = yHalf - texEntry.texture.info.yCenter;
        const one = vec3.fromValues(
            -xHalf + xOffset, yHalf + yOffset, 0.0
        );
        const two = vec3.fromValues(
            xHalf + xOffset, yHalf + yOffset, 0.0
        );
        const three = vec3.fromValues(
            xHalf + xOffset, -yHalf + yOffset, 0.0
        );
        const four = vec3.fromValues(
            -xHalf + xOffset, -yHalf + yOffset, 0.0
        );

        // Texture coordinates.
        const ua1 = texEntry.xPos / this.parent.spriteAtlas.length;
        const va1 = texEntry.yPos / this.parent.spriteAtlas.length;
        const ua2 = (texEntry.xPos + texEntry.texture.img.width) / this.parent.spriteAtlas.length;
        const va2 = (texEntry.yPos + texEntry.texture.img.height) / this.parent.spriteAtlas.length;
        const ut1 = 0;
        const ut2 = 1;
        const vt1 = 0;
        const vt2 = 1;

        // Figure out the brightness of the surrounding polygon.
        // const polygon = level.polygons[entity.polygon];
        // const rBright = polygon.brightness[0] / 256;
        // const gBright = polygon.brightness[1] / 256;
        // const bBright = polygon.brightness[2] / 256;

        const rBright = 1.0;
        const gBright = 1.0;
        const bBright = 1.0;

        // Draw a sprite into the vertex and index buffers.
        const vCount = this.weaponVertCount;
        WorldProgram.setVertex(
            this.weaponVerts, vCount, one[0], one[1], one[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt2, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.weaponVerts, vCount + 1, two[0], two[1], two[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt2, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.weaponVerts, vCount + 2, three[0], three[1], three[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt1, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.weaponVerts, vCount + 3, four[0], four[1], four[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt1, rBright, gBright, bBright
        );

        const iCount = this.weaponIndCount;
        this.weaponInds[iCount] = vCount;
        this.weaponInds[iCount + 1] = vCount + 1;
        this.weaponInds[iCount + 2] = vCount + 2;
        this.weaponInds[iCount + 3] = vCount + 2;
        this.weaponInds[iCount + 4] = vCount + 3;
        this.weaponInds[iCount + 5] = vCount + 0;

        this.weaponVertCount += 4;
        this.weaponIndCount += 6;
    }

    /**
     * Clear weapon vertexes.
     */
    clearWeapon(): void {
        this.weaponVertCount = 0;
        this.weaponIndCount = 0;
    }

    /**
     * Render all flat graphics.
     */
    render(): void {
        if (this.parent.spriteTexAtlas === undefined) {
            throw new Error('Missing texture atlas');
        }

        const gl = this.parent.gl;

        // Clear the depth buffer - we're always going to draw our flat
        // graphics in front of everything else.
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // Use the world program.
        gl.useProgram(this.parent.worldProgram.program);

        // Bind the sprite atlas texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.parent.spriteTexAtlas.texture);
        gl.uniform1i(this.parent.worldProgram.uTexture, 0);

        // Set up our attributes.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        this.parent.worldProgram.bindAttributes();

        // Bind our projection matrix.
        gl.uniformMatrix4fv(this.parent.worldProgram.uProjection, false, this.project);

        // Bind our weapon camera data.
        const weaponView = mat4.create();//getViewMatrix(createCamera(0, 0, 0));
        gl.uniformMatrix4fv(this.parent.worldProgram.uView, false, weaponView);

        // Load our weapon data.
        gl.bufferData(gl.ARRAY_BUFFER, this.weaponVerts, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.weaponInds, gl.STATIC_DRAW);

        // Draw the weapon.
        gl.drawElements(gl.TRIANGLES, this.weaponIndCount, gl.UNSIGNED_SHORT, 0);

        // Cleanup.
        this.parent.worldProgram.unbindAttributes();
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.useProgram(null);
    }
}