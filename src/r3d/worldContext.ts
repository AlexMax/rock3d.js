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

import { glMatrix, mat4, quat, vec2, vec3 } from 'gl-matrix';

import { Camera, createCamera, getViewMatrix } from './camera';
import { Entity } from '../entity';
import { Level } from '../level';
import { constrain, sphereToCartesian, quatToEuler } from '../math';
import { RenderContext } from './render';
import { WorldProgram } from './worldProgram';

/**
 * Billboard a single vertex of a sprite.
 * 
 * @param out Out vector.
 * @param spriteCenter Center of sprite.
 * @param offset Vertex of the sprite to billboard, in terms of the X, Y
 *               offset from the center.
 * @param right Right vector in world coordinates.
 * @param up Up vector in world coordinates.
 */
const billboardVertex = (
    out: vec3, spriteCenter: vec3, offset: vec2, right: vec3, up: vec3,
) => {
    const calcRight = vec3.copy(vec3.create(), right);
    vec3.scale(calcRight, calcRight, offset[0]);
    const calcUp = vec3.copy(vec3.create(), up);
    vec3.scale(calcUp, calcUp, offset[1]);
    vec3.copy(out, spriteCenter);
    vec3.add(out, out, calcRight);
    vec3.add(out, out, calcUp);
    return out;
}

/**
 * Return a sprite rotation index from 1 to 8 given a camera and sprite
 * angle.
 *
 * @param camAngle World angle of camera.
 * @param sprAngle World angle of sprite.
 */
const spriteRot = (camAngle: number, sprAngle: number): number => {
    camAngle += 180; sprAngle += 180;
    const angle = ((sprAngle + 202.5 - camAngle) + 360) % 360;
    return Math.floor(angle / 45) + 1;
}

export class WorldContext {
    parent: RenderContext; // Reference to parent

    project: mat4;

    worldVerts: ArrayBuffer;
    worldVertCount: number;
    worldInds: Uint16Array;
    worldIndCount: number;

    spriteVerts: ArrayBuffer;
    spriteVertCount: number;
    spriteInds: Uint16Array;
    spriteIndCount: number;

    skyVerts: ArrayBuffer;
    skyVertCount: number;
    skyInds: Uint16Array;
    skyIndCount: number;

    vbo: WebGLBuffer;
    ebo: WebGLBuffer;

    constructor(parent: RenderContext) {
        this.parent = parent;
        const gl = parent.gl;

        this.project = mat4.create();

        // Polygon vertexes and indexes.
        this.worldVerts = new ArrayBuffer(32768);
        this.worldVertCount = 0;
        this.worldInds = new Uint16Array(2048);
        this.worldIndCount = 0;

        // Sprite vertexes and indexes.
        this.spriteVerts = new ArrayBuffer(32768);
        this.spriteVertCount = 0;
        this.spriteInds = new Uint16Array(2048);
        this.spriteIndCount = 0;

        // Sky vertexes and indexes.
        this.skyVerts = new ArrayBuffer(32768);
        this.skyVertCount = 0;
        this.skyInds = new Uint16Array(1024);
        this.skyIndCount = 0;

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
    setProject(fov: number): void {
        const gl = this.parent.gl;
        const canvas = gl.canvas as HTMLCanvasElement;

        // Setup the projection matrix.
        mat4.perspective(this.project, glMatrix.toRadian(fov),
            canvas.clientWidth / canvas.clientHeight, 1, 10_000);
    }

    /**
     * Add a wall to the set of things to render.
     *
     * Note that we need a working texture atlas at this point, otherwise
     * we have no clue what the texture coordinates need to be.
     * 
     * @param one First vertex.
     * @param two Second vertex.
     * @param z1 Floor height.
     * @param z2 Ceiling height.
     * @param tex Texture name.
     * @param bright Wall brightness.
     */
    addWall(one: vec2, two: vec2, z1: number, z2: number, tex: string, bright: vec3): void {
        if (this.parent.worldAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Find the texture of the wall in the atlas
        const texEntry = this.parent.worldAtlas.find(tex);
        if (texEntry === null) {
            throw new Error(`Unknown texture ${texEntry}`);
        }

        const ua1 = texEntry.xPos / this.parent.worldAtlas.length;
        const va1 = texEntry.yPos / this.parent.worldAtlas.length;
        const ua2 = (texEntry.xPos + texEntry.texture.img.width) / this.parent.worldAtlas.length;
        const va2 = (texEntry.yPos + texEntry.texture.img.height) / this.parent.worldAtlas.length;

        const hDist = vec2.length(vec2.sub(vec2.create(), one, two));
        const vDist = z2 - z1;

        const ut1 = 0;
        const vt1 = 0;
        const ut2 = hDist / texEntry.texture.img.width;
        const vt2 = vDist / texEntry.texture.img.height;

        // Adjust brightness depending on which direction the wall is going.
        // Angles that are parallel to the X axis are darker, angles that
        // are parallel to the Y axis are brighter.  This is known as "fake
        // contrast".
        // 
        // TODO: A triangle wave would probably look more consistent than
        //       a sinusoid, but this works well enough for now.
        const angle = Math.atan2(two[1] - one[1], two[0] - one[0]);
        const fBright = Math.cos(2 * angle) * -16;

        const rBright = constrain((bright[0] + fBright) / 256, 0, 1);
        const gBright = constrain((bright[1] + fBright) / 256, 0, 1);
        const bBright = constrain((bright[2] + fBright) / 256, 0, 1);

        // Draw a wall into the vertex and index buffers.
        //
        // Assuming you want to face the square head-on, xyz1 is the lower-left
        // coordinate and xyz2 is the upper-right coordinate.
        const vCount = this.worldVertCount;
        WorldProgram.setVertex(
            this.worldVerts, vCount, one[0], one[1], z1, ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt2, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.worldVerts, vCount + 1, two[0], two[1], z1, ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt2, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.worldVerts, vCount + 2, two[0], two[1], z2, ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt1, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.worldVerts, vCount + 3, one[0], one[1], z2, ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt1, rBright, gBright, bBright
        );

        const iCount = this.worldIndCount;
        this.worldInds[iCount] = vCount;
        this.worldInds[iCount + 1] = vCount + 1;
        this.worldInds[iCount + 2] = vCount + 2;
        this.worldInds[iCount + 3] = vCount + 2;
        this.worldInds[iCount + 4] = vCount + 3;
        this.worldInds[iCount + 5] = vCount + 0;

        this.worldVertCount += 4;
        this.worldIndCount += 6;
    }

    /**
     * Add a flat (floor or ceiling) tessellation to the set of things to render
     * 
     * @param verts Vertexes of the floor or ceiling.
     * @param inds Vertex indexes to tessellate with.
     * @param z Z-level to add the tessellation to.
     * @param tex Texture name.
     * @param bright Floor or ceiling brightness.
     */
    addFlatTessellation(verts: number[], inds: number[], z: number, tex: string, bright: vec3): void {
        if (tex === 'F_SKY1') {
            // Don't draw the sky.
            return;
        }

        if (this.parent.worldAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Find the texture of the flat in the atlas
        const texEntry = this.parent.worldAtlas.find(tex);
        if (texEntry === null) {
            throw new Error(`Unknown texture ${texEntry}`);
        }

        const ua1 = texEntry.xPos / this.parent.worldAtlas.length;
        const va1 = texEntry.yPos / this.parent.worldAtlas.length;
        const ua2 = (texEntry.xPos + texEntry.texture.img.width) / this.parent.worldAtlas.length;
        const va2 = (texEntry.yPos + texEntry.texture.img.height) / this.parent.worldAtlas.length;

        const rBright = bright[0] / 256;
        const gBright = bright[1] / 256;
        const bBright = bright[2] / 256;

        // Draw the triangle into the buffers.
        const vCountStart = this.worldVertCount;
        for (let i = 0;i < verts.length - 1;i += 2) {
            const vCount = this.worldVertCount;
            const ut = verts[i] / texEntry.texture.img.width;
            const vt = -(verts[i+1] / texEntry.texture.img.height);

            WorldProgram.setVertex(
                this.worldVerts, vCount, verts[i], verts[i+1], z,
                ua1, va1, ua2 - ua1, va2 - va1, ut, vt, rBright, gBright, bBright
            );
            this.worldVertCount += 1;
        }

        for (let i = 0;i < inds.length;i++) {
            const iCount = this.worldIndCount;
            this.worldInds[iCount] = vCountStart + inds[i];
            this.worldIndCount += 1;
        }
    }

    /**
     * Add a complete polygon to the set of things to render.
     * 
     * @param level Set of level data to use while rendering.
     * @param index Polygon index to actually render.
     */
    addPolygon(level: Level, polyID: number): void {
        const polygon = level.polygons[polyID];

        // Draw walls of the polygon
        for (let i = 0;i < polygon.edgeIDs.length;i++) {
            const edge = level.edges[polygon.edgeIDs[i]];

            // Is this a one-sided wall or a portal?
            if (typeof edge.backPoly === 'number') {
                const backPoly = level.polygons[edge.backPoly];
                if (polygon.ceilHeight > backPoly.ceilHeight && edge.upperTex !== null ) {
                    this.addWall(edge.vertex, edge.nextVertex, backPoly.ceilHeight, polygon.ceilHeight, edge.upperTex, polygon.brightness);
                }
                if (polygon.floorHeight < backPoly.floorHeight && edge.lowerTex !== null ) {
                    this.addWall(edge.vertex, edge.nextVertex, polygon.floorHeight, backPoly.floorHeight, edge.lowerTex, polygon.brightness);
                }
            } else {
                if (edge.middleTex !== null) {
                    this.addWall(edge.vertex, edge.nextVertex, polygon.floorHeight, polygon.ceilHeight, edge.middleTex, polygon.brightness);
                }
            }
        }

        // Draw the floor and ceiling of the polygon
        this.addFlatTessellation(
            polygon.vertsCache, polygon.floorIndsCache,
            polygon.floorHeight, polygon.floorTex, polygon.brightness
        );
        this.addFlatTessellation(
            polygon.vertsCache, polygon.ceilIndsCache,
            polygon.ceilHeight, polygon.ceilTex, polygon.brightness
        );
    }

    /**
     * Add an entity to the set of things to render.
     * 
     * Entities are represented as sprites that are billboarded towards
     * the camera.
     * 
     * @param level Level to use when looking up polygon.
     * @param entity Entity to render.
     * @param frame Sprite frame to render.
     * @param cam Camera to billboard relative to.
     */
    addEntity(level: Level, entity: Entity, frame: string, cam: Camera): void {
        if (this.parent.spriteAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Determine which sprite to use.
        const camAngle = quatToEuler(vec3.create(), cam.dir);
        const entAngle = quatToEuler(vec3.create(), entity.rotation);
        const sprPrefix = entity.config.spritePrefix;
        const sprIndex = spriteRot(camAngle[2], entAngle[2]);
        var flipped = false;
        switch (sprIndex) {
        case 1:
            var tex = sprPrefix + frame + '1';
            break;
        case 2:
            flipped = true;
        case 8:
            var tex = sprPrefix + frame + '2A8';
            break;
        case 3:
            flipped = true;
        case 7:
            var tex = sprPrefix + frame + '3A7';
            break;
        case 4:
            flipped = true;
        case 6:
            var tex = sprPrefix + frame + '4A6';
            break;
        case 5:
            var tex = sprPrefix + frame + '5';
            break;
        default:
            throw new Error(`Unknown rotation index ${sprIndex}`);
        }

        // Find the texture of the wall in the atlas
        let texEntry = this.parent.spriteAtlas.find(tex);
        if (texEntry === null) {
            // Sprite doesn't have rotations, try the default rotation.
            texEntry = this.parent.spriteAtlas.find(sprPrefix + frame + '0');
            if (texEntry === null) {
                throw new Error(`Unknown sprite ${texEntry}`);
            }

            // Sprites without rotations are never flipped.
            flipped = false;
        }

        const ua1 = texEntry.xPos / this.parent.spriteAtlas.length;
        const va1 = texEntry.yPos / this.parent.spriteAtlas.length;
        const ua2 = (texEntry.xPos + texEntry.texture.img.width) / this.parent.spriteAtlas.length;
        const va2 = (texEntry.yPos + texEntry.texture.img.height) / this.parent.spriteAtlas.length;

        if (flipped) {
            var ut2 = 0;
            var ut1 = 1;
        } else {
            var ut1 = 0;
            var ut2 = 1;
        }

        const vt1 = 0;
        const vt2 = 1;

        // Figure out the brightness of the surrounding polygon.
        const polygon = level.polygons[entity.polygon];
        const rBright = polygon.brightness[0] / 256;
        const gBright = polygon.brightness[1] / 256;
        const bBright = polygon.brightness[2] / 256;

        const spriteCenter = vec3.copy(vec3.create(), entity.position);

        // Figure out where our camera is.
        if (entity.config.grounded) {
            // Sprite center is attached to the floor.
            spriteCenter[2] += texEntry.texture.img.height / 2;

            // Only billboard yaw axis.
            const euler = quatToEuler(vec3.create(), cam.dir);
            const newDir = quat.fromEuler(quat.create(), 0, 0, euler[2]);
            var view = getViewMatrix({
                pos: cam.pos,
                dir: newDir,
            });
        } else {
            // Billboard all axes.
            var view = getViewMatrix(cam);
        }

        // Billboard our sprite positions towards the camera.
        const viewInv = mat4.invert(mat4.create(), view);
        if (viewInv === null) {
            throw new Error('viewInv is null');
        }

        const worldRight = vec3.fromValues(viewInv[0], viewInv[1], viewInv[2]);
        const worldUp = vec3.fromValues(viewInv[4], viewInv[5], viewInv[6]);

        // Four vertexes of the sprite.
        const left = -texEntry.texture.info.xCenter;
        const right = left + texEntry.texture.img.width;
        const down = -texEntry.texture.info.yCenter;
        const up = down + texEntry.texture.img.height;
        const lowerLeft = vec2.fromValues(left, down);
        const lowerRight = vec2.fromValues(right, down);
        const upperRight = vec2.fromValues(right, up);
        const upperLeft = vec2.fromValues(left, up);

        // Calculation to transform the four vertexes.
        const one = billboardVertex(
            vec3.create(), spriteCenter, lowerLeft, worldRight, worldUp
        );
        const two = billboardVertex(
            vec3.create(), spriteCenter, lowerRight, worldRight, worldUp
        );
        const three = billboardVertex(
            vec3.create(), spriteCenter, upperRight, worldRight, worldUp
        );
        const four = billboardVertex(
            vec3.create(), spriteCenter, upperLeft, worldRight, worldUp
        );

        // Draw a sprite into the vertex and index buffers.
        const vCount = this.spriteVertCount;
        WorldProgram.setVertex(
            this.spriteVerts, vCount, one[0], one[1], one[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt2, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.spriteVerts, vCount + 1, two[0], two[1], two[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt2, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.spriteVerts, vCount + 2, three[0], three[1], three[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt1, rBright, gBright, bBright
        );
        WorldProgram.setVertex(
            this.spriteVerts, vCount + 3, four[0], four[1], four[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt1, rBright, gBright, bBright
        );

        const iCount = this.spriteIndCount;
        this.spriteInds[iCount] = vCount;
        this.spriteInds[iCount + 1] = vCount + 1;
        this.spriteInds[iCount + 2] = vCount + 2;
        this.spriteInds[iCount + 3] = vCount + 2;
        this.spriteInds[iCount + 4] = vCount + 3;
        this.spriteInds[iCount + 5] = vCount + 0;

        this.spriteVertCount += 4;
        this.spriteIndCount += 6;
    }

    /**
     * Add sky sphere.
     * 
     * The sky sphere is a basic UV sphere of constant size.
     */
    addSky(texName: string): void {
        if (this.parent.worldAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Find the texture of the sky in the atlas
        const texEntry = this.parent.worldAtlas.find(texName);
        if (texEntry === null) {
            throw new Error(`Unknown texture ${texName}`);
        }

        const ua1 = texEntry.xPos / this.parent.worldAtlas.length;
        const va1 = texEntry.yPos / this.parent.worldAtlas.length;
        const ua2 = (texEntry.xPos + texEntry.texture.img.width) / this.parent.worldAtlas.length;
        const va2 = (texEntry.yPos + texEntry.texture.img.height) / this.parent.worldAtlas.length;

        // Number of parallel lines, not counting the two poles. 
        const parallelsCount = 9;

        // Number of meridians per parallel.
        const meridiansCount = 16;

        // Radius of circle in world units.
        const radius = 128;

        // Vertex #1 is at the top of the sphere.
        let vCount = this.skyVertCount;
        WorldProgram.setVertex(
            this.skyVerts, vCount, 0, 0, radius,
            ua1, va1, ua2 - ua1, va2 - va1, 0, 0, 1, 1, 1
        );
        vCount += 1;

        // Vertex #2 is at the bottom of the sphere.
        WorldProgram.setVertex(
            this.skyVerts, vCount, 0, 0, -radius,
            ua1, va1, ua2 - ua1, va2 - va1, 0, 0, 1, 1, 1
        );
        vCount += 1;

        // Generate coordinates for all points on the sphere in between the
        // two poles.
        for (let i = 0;i < parallelsCount;i++) {
            const parallel = Math.PI * (i + 1) / (parallelsCount + 1);
            const vt = (i / (parallelsCount - 1)) * (256 / texEntry.texture.img.height);
            for (let j = 0;j <= meridiansCount;j++) {
                const meridian = 2.0 * Math.PI * j / meridiansCount;
                const pos = sphereToCartesian(vec3.create(), radius, parallel, meridian);
                const ut = (j / (meridiansCount)) * (1024 / texEntry.texture.img.width);
                WorldProgram.setVertex(
                    this.skyVerts, vCount, pos[0], pos[1], pos[2],
                    ua1, va1, ua2 - ua1, va2 - va1, ut, vt, 1, 1, 1
                );
                vCount += 1;
            }
        }

        // Generate indexes to draw the sphere from the inside.
        let iCount = this.skyIndCount;

        // Draw squares between parallels.
        for (let i = 0;i < parallelsCount - 1;i++) {
            const thisPIndex = this.skyVertCount + 2 + i * (meridiansCount + 1);
            const nextPIndex = this.skyVertCount + 2 + ((i + 1) * (meridiansCount + 1));
            for (let j = 0;j < meridiansCount;j++) {
                const iOne = thisPIndex + j;
                const iTwo = thisPIndex + j + 1;
                const iThree = nextPIndex + j;
                const iFour = nextPIndex + j + 1;
                this.skyInds[iCount] = iOne;
                this.skyInds[iCount + 1] = iTwo;
                this.skyInds[iCount + 2] = iThree;
                this.skyInds[iCount + 3] = iThree;
                this.skyInds[iCount + 4] = iTwo;
                this.skyInds[iCount + 5] = iFour;
                iCount += 6;
            }
        }

        this.skyVertCount = vCount;
        this.skyIndCount = iCount;
    }

    /**
     * Clear the world vertexes.
     */
    clearWorld(): void {
        this.worldVertCount = 0;
        this.worldIndCount = 0;
    }

    /**
     * Clear the sprite vertexes.
     */
    clearSprites(): void {
        this.spriteVertCount = 0;
        this.spriteIndCount = 0;
    }

    /**
     * Clear sky vertexes.
     */
    clearSky(): void {
        this.skyVertCount = 0;
        this.skyIndCount = 0;
    }

    /**
     * Render the world.
     * 
     * @param cam Camera that we're rendering a point of view from.
     */
    render(cam: Camera): void {
        if (
            this.parent.worldTexAtlas === undefined ||
            this.parent.spriteTexAtlas === undefined
        ) {
            throw new Error('Missing texture atlas');
        }

        const gl = this.parent.gl;

        // Clear the buffer.
        gl.clearColor(0.0, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use the world program.
        gl.useProgram(this.parent.worldProgram.program);

        // Bind the world atlas texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.parent.worldTexAtlas.texture);
        gl.uniform1i(this.parent.worldProgram.uTexture, 0);

        // Bind our projection matrix.
        gl.uniformMatrix4fv(
            this.parent.worldProgram.uProjection, false, this.project
        );

        // Bind our sky camera data.
        const skyCam = createCamera(0, 0, 0);
        skyCam.dir = cam.dir;
        const skyView = getViewMatrix(skyCam);
        gl.uniformMatrix4fv(this.parent.worldProgram.uView, false, skyView);

        // Set up our attributes.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        this.parent.worldProgram.bindAttributes();

        // Load our sky data.
        gl.bufferData(gl.ARRAY_BUFFER, this.skyVerts, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.skyInds, gl.STATIC_DRAW);

        // Draw the sky.
        gl.drawElements(gl.TRIANGLES, this.skyIndCount, gl.UNSIGNED_SHORT, 0);

        // Clear the depth buffer - we're always going to draw our world
        // in front of the sky.
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // Bind our world camera data.
        const worldView = getViewMatrix(cam);
        gl.uniformMatrix4fv(this.parent.worldProgram.uView, false, worldView);

        // Load our world data.
        gl.bufferData(gl.ARRAY_BUFFER, this.worldVerts, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.worldInds, gl.STATIC_DRAW);

        // Draw the world.
        gl.drawElements(gl.TRIANGLES, this.worldIndCount, gl.UNSIGNED_SHORT, 0);

        // Bind the sprite atlas texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.parent.spriteTexAtlas.texture);
        gl.uniform1i(this.parent.worldProgram.uTexture, 0);

        // Load our sprite data.
        gl.bufferData(gl.ARRAY_BUFFER, this.spriteVerts, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.spriteInds, gl.STATIC_DRAW);

        // Draw the sprites.
        gl.drawElements(gl.TRIANGLES, this.spriteIndCount, gl.UNSIGNED_SHORT, 0);

        // Cleanup.
        this.parent.worldProgram.unbindAttributes();
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.useProgram(null);
    }
}
