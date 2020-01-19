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

import { Atlas } from '../atlas';
import { Camera, create as createCamera, getViewMatrix } from './camera';
import { Entity } from '../entity';
import { Level } from '../level';
import { constrain, sphereToCartesian, quatToEuler } from '../math';
import { RenderContext } from './render';
import { compileShader, linkShaderProgram } from './shader';

import world_vert from './shader/world.vert';
import world_frag from './shader/world.frag';

const ATLAS_SIZE = 512;

/**
 * Return the number of bytes needed to hold the given number of vertexes.
 * 
 * @param count Number of vertexes to measure.
 */
const vertexBytes = (count: number) => {
    return count * 48;
}

/**
 * Write Vertex data to a buffer.
 * 
 * FIXME: Detect and deal with big-endian platforms...if they exist anymore.
 * 
 * @param buffer Destination buffer for vertex data.
 * @param index In a buffer that can hold multiple vertexes, the number of
 *              vertexes that come before (in the data) the vertex you want
 *              to write.
 */
const setVertex = (
    buffer: ArrayBuffer, index: number, x: number, y: number, z: number,
    uAtOrigin: number, vAtOrigin: number, uAtLen: number, vAtLen: number,
    uTex: number, vTex: number, rBright: number, gBright: number,
    bBright: number
): ArrayBuffer => {
    const view = new DataView(buffer, vertexBytes(index), vertexBytes(1));
    view.setFloat32(0, x, true);
    view.setFloat32(4, y, true);
    view.setFloat32(8, z, true);
    view.setFloat32(12, uAtOrigin, true);
    view.setFloat32(16, vAtOrigin, true);
    view.setFloat32(20, uAtLen, true);
    view.setFloat32(24, vAtLen, true);
    view.setFloat32(28, uTex, true);
    view.setFloat32(32, vTex, true);
    view.setFloat32(36, rBright, true);
    view.setFloat32(40, gBright, true);
    view.setFloat32(44, bBright, true);

    return buffer;
}

/**
 * Billboard a single vertex of a sprite.
 * 
 * @param out Out vector.
 * @param spriteCenter Center of sprite.
 * @param offset Vertex of the sprite to billboard, in terms of the X, Y
 *               offset from the center.  0.0 is no offset, 1.0 is the
 *               entire width/height of the sprite.
 * @param right Right vector in world coordinates.
 * @param up Up vector in world coordinates.
 * @param width Width of sprite.
 * @param height Height of sprite.
 */
const billboardVertex = (
    out: vec3, spriteCenter: vec3, offset: vec2, right: vec3, up: vec3,
    width: number, height: number
) => {
    const calcRight = vec3.copy(vec3.create(), right);
    vec3.scale(calcRight, calcRight, offset[0]);
    vec3.scale(calcRight, calcRight, width);
    const calcUp = vec3.copy(vec3.create(), up);
    vec3.scale(calcUp, calcUp, offset[1]);
    vec3.scale(calcUp, calcUp, height);
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

    worldProg: WebGLProgram;
    worldAtlas?: Atlas;
    worldTexAtlas: WebGLTexture;
    worldVBO: WebGLBuffer;
    worldVerts: ArrayBuffer;
    worldVertCount: number;
    worldEBO: WebGLBuffer;
    worldInds: Uint16Array;
    worldIndCount: number;
    worldProject: mat4;
    world_lPos: GLuint;
    world_lAtlasInfo: GLuint;
    world_lTexCoord: GLuint;
    world_lBright: GLuint;

    spriteAtlas?: Atlas;
    spriteTexAtlas: WebGLTexture;
    spriteVerts: ArrayBuffer;
    spriteVertCount: number;
    spriteInds: Uint16Array;
    spriteIndCount: number;

    skyVerts: ArrayBuffer;
    skyVertCount: number;
    skyInds: Uint16Array;
    skyIndCount: number;

    constructor(parent: RenderContext) {
        this.parent = parent;
        const gl = parent.gl;

        // Set up non-JS data.

        // Polygon vertexes and indexes.
        this.worldVerts = new ArrayBuffer(32768);
        this.worldVertCount = 0;
        this.worldInds = new Uint16Array(2048);
        this.worldIndCount = 0;
        this.worldProject = mat4.create();

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

        // 3D shader program, used for rendering walls, floors and ceilings.
        const vs = compileShader(gl, gl.VERTEX_SHADER, world_vert);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, world_frag);

        this.worldProg = linkShaderProgram(gl, [vs, fs]);

        // We need vertex buffers...
        const vbo = gl.createBuffer();
        if (vbo === null) {
            throw new Error('Could not allocate worldVBO');
        }
        this.worldVBO = vbo;

        // ...and index buffers...
        const ebo = gl.createBuffer();
        if (ebo === null) {
            throw new Error('Could not allocate worldEBO');
        }
        this.worldEBO = ebo;

        // Keep track of our attributes.
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        // x, y, and z positions.
        this.world_lPos = gl.getAttribLocation(this.worldProg, 'lPos');
        if (this.world_lPos === -1) {
            throw new Error('Could not find lPos in world program');
        }
        // u and v texture coordinates for the texture atlas.
        this.world_lAtlasInfo = gl.getAttribLocation(this.worldProg, 'lAtlasInfo');
        if (this.world_lAtlasInfo === -1) {
            throw new Error('Could not find lAtlasInfo in world program');
        }
        // u and v texture coordinates for the texture itself.
        this.world_lTexCoord = gl.getAttribLocation(this.worldProg, 'lTexCoord');
        if (this.world_lTexCoord === -1) {
            throw new Error('Could not find lTexCoord in world program');
        }
        // Brightness modifier.
        this.world_lBright = gl.getAttribLocation(this.worldProg, 'lBright');
        if (this.world_lBright === -1) {
            throw new Error('Could not find lBright in world program');
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null); // So we don't modify the buffer

        // Set up the texture atlas texture
        const worldTexAtlas = gl.createTexture();
        if (worldTexAtlas === null) {
            throw new Error('Could not create texture atlas object');
        }
        this.worldTexAtlas = worldTexAtlas;
        gl.bindTexture(gl.TEXTURE_2D, this.worldTexAtlas);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Assign the texture atlas to the world program
        gl.useProgram(this.worldProg);
        const textureLoc = gl.getUniformLocation(this.worldProg, "uTexture");
        if (textureLoc === null) {
            throw new Error('uTexture uniform location could not be found');
        }
        gl.uniform1i(textureLoc, 0); // TEXTURE0

        // Upload a blank hot pink texture to the atlas.
        const blankTextureAtlas = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
        for (let i = 0;i < blankTextureAtlas.byteLength;i+=4) {
            blankTextureAtlas[i] = 255;
            blankTextureAtlas[i + 1] = 0;
            blankTextureAtlas[i + 2] = 255;
            blankTextureAtlas[i + 3] = 255;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_SIZE, ATLAS_SIZE, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, blankTextureAtlas);

        // Unbind texture so we don't accidentally mess with it.
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Set up the sprite atlas texture
        const spriteTexAtlas = gl.createTexture();
        if (spriteTexAtlas === null) {
            throw new Error('Could not create texture atlas object');
        }
        this.spriteTexAtlas = spriteTexAtlas;
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTexAtlas);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Assign the texture atlas to the world program
        gl.useProgram(this.worldProg);
        const atlasLoc = gl.getUniformLocation(this.worldProg, "uTexture");
        if (atlasLoc === null) {
            throw new Error('uTexture uniform location could not be found');
        }
        gl.uniform1i(atlasLoc, 0); // TEXTURE0

        // Upload a blank hot pink texture to the atlas.
        const blankSpriteAtlas = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
        for (let i = 0;i < blankSpriteAtlas.byteLength;i+=4) {
            blankSpriteAtlas[i] = 255;
            blankSpriteAtlas[i + 1] = 0;
            blankSpriteAtlas[i + 2] = 255;
            blankSpriteAtlas[i + 3] = 0;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_SIZE, ATLAS_SIZE, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, blankSpriteAtlas);

        // Unbind texture so we don't accidentally mess with it.
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Set up the projection matrix for the given FOV.
     * 
     * @param fov FOV in degrees.
     */
    setProject(fov: number): void {
        const gl = this.parent.gl;
        const canvas = gl.canvas as HTMLCanvasElement;

        // Use the world program.
        gl.useProgram(this.worldProg);

        // Setup the projection matrix.
        mat4.perspective(this.worldProject, glMatrix.toRadian(fov),
            canvas.clientWidth / canvas.clientHeight, 1, 10_000);

        // Make sure our projection matrix goes into the shader program.
        const projectionLoc = gl.getUniformLocation(this.worldProg, "uProjection");
        gl.uniformMatrix4fv(projectionLoc, false, this.worldProject);
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
        if (this.worldAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Find the texture of the wall in the atlas
        const texEntry = this.worldAtlas.find(tex);
        if (texEntry === null) {
            throw new Error(`Unknown texture ${texEntry}`);
        }

        let ua1 = texEntry.xPos / this.worldAtlas.length;
        let va1 = texEntry.yPos / this.worldAtlas.length;
        let ua2 = (texEntry.xPos + texEntry.texture.width) / this.worldAtlas.length;
        let va2 = (texEntry.yPos + texEntry.texture.height) / this.worldAtlas.length;

        let hDist = vec2.length(vec2.sub(vec2.create(), one, two));
        let vDist = z2 - z1;

        let ut1 = 0;
        let vt1 = 0;
        let ut2 = hDist / texEntry.texture.width;
        let vt2 = vDist / texEntry.texture.height;

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
        setVertex(this.worldVerts, vCount, one[0], one[1], z1, ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt2, rBright, gBright, bBright);
        setVertex(this.worldVerts, vCount + 1, two[0], two[1], z1, ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt2, rBright, gBright, bBright);
        setVertex(this.worldVerts, vCount + 2, two[0], two[1], z2, ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt1, rBright, gBright, bBright);
        setVertex(this.worldVerts, vCount + 3, one[0], one[1], z2, ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt1, rBright, gBright, bBright);

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

        if (this.worldAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Find the texture of the flat in the atlas
        const texEntry = this.worldAtlas.find(tex);
        if (texEntry === null) {
            throw new Error(`Unknown texture ${texEntry}`);
        }

        let ua1 = texEntry.xPos / this.worldAtlas.length;
        let va1 = texEntry.yPos / this.worldAtlas.length;
        let ua2 = (texEntry.xPos + texEntry.texture.width) / this.worldAtlas.length;
        let va2 = (texEntry.yPos + texEntry.texture.height) / this.worldAtlas.length;

        const rBright = bright[0] / 256;
        const gBright = bright[1] / 256;
        const bBright = bright[2] / 256;

        // Draw the triangle into the buffers.
        const vCountStart = this.worldVertCount;
        for (let i = 0;i < verts.length - 1;i += 2) {
            let vCount = this.worldVertCount;
            let ut = verts[i] / texEntry.texture.width;
            let vt = -(verts[i+1] / texEntry.texture.height);

            setVertex(this.worldVerts, vCount, verts[i], verts[i+1], z,
                ua1, va1, ua2 - ua1, va2 - va1, ut, vt, rBright, gBright, bBright);
            this.worldVertCount += 1;
        }

        for (let i = 0;i < inds.length;i++) {
            let iCount = this.worldIndCount;
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
     * @param cam Camera to billboard relative to.
     */
    addEntity(level: Level, entity: Entity, cam: Camera): void {
        if (this.spriteAtlas === undefined) {
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
            var tex = sprPrefix + 'A1';
            break;
        case 2:
            flipped = true;
        case 8:
            var tex = sprPrefix + 'A2A8';
            break;
        case 3:
            flipped = true;
        case 7:
            var tex = sprPrefix + 'A3A7';
            break;
        case 4:
            flipped = true;
        case 6:
            var tex = sprPrefix + 'A4A6';
            break;
        case 5:
            var tex = sprPrefix + 'A5';
            break;
        default:
            throw new Error(`Unknown rotation index ${sprIndex}`);
        }

        // Find the texture of the wall in the atlas
        let texEntry = this.spriteAtlas.find(tex);
        if (texEntry === null) {
            // Sprite doesn't have rotations, try the default rotation.
            texEntry = this.spriteAtlas.find(sprPrefix + 'A0');
            if (texEntry === null) {
                throw new Error(`Unknown sprite ${texEntry}`);
            }
        }

        const ua1 = texEntry.xPos / this.spriteAtlas.length;
        const va1 = texEntry.yPos / this.spriteAtlas.length;
        const ua2 = (texEntry.xPos + texEntry.texture.width) / this.spriteAtlas.length;
        const va2 = (texEntry.yPos + texEntry.texture.height) / this.spriteAtlas.length;

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
            spriteCenter[2] += Math.ceil(texEntry.texture.height / 2);

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
        const lowerLeft = vec2.fromValues(-0.5, -0.5);
        const lowerRight = vec2.fromValues(0.5, -0.5);
        const upperRight = vec2.fromValues(0.5, 0.5);
        const upperLeft = vec2.fromValues(-0.5, 0.5);

        // Calculation to transform the four vertexes.
        const one = billboardVertex(vec3.create(), spriteCenter, lowerLeft,
            worldRight, worldUp, texEntry.texture.width, texEntry.texture.height);
        const two = billboardVertex(vec3.create(), spriteCenter, lowerRight,
            worldRight, worldUp, texEntry.texture.width, texEntry.texture.height);
        const three = billboardVertex(vec3.create(), spriteCenter, upperRight,
            worldRight, worldUp, texEntry.texture.width, texEntry.texture.height);
        const four = billboardVertex(vec3.create(), spriteCenter, upperLeft,
            worldRight, worldUp, texEntry.texture.width, texEntry.texture.height);

        // Draw a sprite into the vertex and index buffers.
        const vCount = this.spriteVertCount;
        setVertex(this.spriteVerts, vCount, one[0], one[1], one[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt2, rBright, gBright, bBright);
        setVertex(this.spriteVerts, vCount + 1, two[0], two[1], two[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt2, rBright, gBright, bBright);
        setVertex(this.spriteVerts, vCount + 2, three[0], three[1], three[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut2, vt1, rBright, gBright, bBright);
        setVertex(this.spriteVerts, vCount + 3, four[0], four[1], four[2], ua1, va1,
            ua2 - ua1, va2 - va1, ut1, vt1, rBright, gBright, bBright);

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
    addSky(tex: string): void {
        if (this.worldAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Find the texture of the sky in the atlas
        const texEntry = this.worldAtlas.find(tex);
        if (texEntry === null) {
            throw new Error(`Unknown texture ${texEntry}`);
        }

        const ua1 = texEntry.xPos / this.worldAtlas.length;
        const va1 = texEntry.yPos / this.worldAtlas.length;
        const ua2 = (texEntry.xPos + texEntry.texture.width) / this.worldAtlas.length;
        const va2 = (texEntry.yPos + texEntry.texture.height) / this.worldAtlas.length;

        // Number of parallel lines, not counting the two poles. 
        const parallelsCount = 9;

        // Number of meridians per parallel.
        const meridiansCount = 16;

        // Radius of circle in world units.
        const radius = 128;

        // Vertex #1 is at the top of the sphere.
        let vCount = this.skyVertCount;
        setVertex(this.skyVerts, vCount, 0, 0, radius,
            ua1, va1, ua2 - ua1, va2 - va1, 0, 0, 1, 1, 1);
        vCount += 1;

        // Vertex #2 is at the bottom of the sphere.
        setVertex(this.skyVerts, vCount, 0, 0, -radius,
            ua1, va1, ua2 - ua1, va2 - va1, 0, 0, 1, 1, 1);
        vCount += 1;

        // Generate coordinates for all points on the sphere in between the
        // two poles.
        for (let i = 0;i < parallelsCount;i++) {
            const parallel = Math.PI * (i + 1) / (parallelsCount + 1);
            const vt = (i / (parallelsCount - 1)) * (256 / texEntry.texture.height);
            for (let j = 0;j <= meridiansCount;j++) {
                const meridian = 2.0 * Math.PI * j / meridiansCount;
                const pos = sphereToCartesian(vec3.create(), radius, parallel, meridian);
                const ut = (j / (meridiansCount)) * (1024 / texEntry.texture.width);
                setVertex(this.skyVerts, vCount, pos[0], pos[1], pos[2],
                    ua1, va1, ua2 - ua1, va2 - va1, ut, vt, 1, 1, 1);
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
     * Persist the texture atlas onto the GPU using the current render context.
     * 
     * @param textures Texture atlas to bake.
     */
    bakeTextureAtlas(textures: Atlas): void {
        // Copy the texture atlas into the render context
        this.worldAtlas = textures;

        // Get the texture atlas onto the GPU
        textures.persist((data, x, y) => {
            const gl = this.parent.gl;

            gl.bindTexture(gl.TEXTURE_2D, this.worldTexAtlas);

            // Corner pixels.
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x - 1, y - 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x + 1, y - 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x - 1, y + 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x + 1, y + 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

            // Side walls.
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x - 1, y, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x + 1, y, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y - 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y + 1, gl.RGBA, gl.UNSIGNED_BYTE, data);

            // Actual texture.
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, data);

            gl.bindTexture(gl.TEXTURE_2D, null);
        });
    }

    /**
     * Persist the sprite atlas onto the GPU using the current render context.
     * 
     * @param sprites Sprite atlas to bake.
     */
    bakeSpriteAtlas(sprites: Atlas): void {
        // Copy the texture atlas into the render context
        this.spriteAtlas = sprites;

        // Get the texture atlas onto the GPU
        sprites.persist((data, x, y) => {
            const gl = this.parent.gl;

            // Actual sprite.
            gl.bindTexture(gl.TEXTURE_2D, this.spriteTexAtlas);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.bindTexture(gl.TEXTURE_2D, null);
        });
    }

    /**
     * Render the world.
     * 
     * @param cam Camera that we're rendering a point of view from.
     */
    render(cam: Camera): void {
        const gl = this.parent.gl;

        // Clear the buffer.
        gl.clearColor(0.0, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use the world program.
        gl.useProgram(this.worldProg);

        // Length of a single vertex.
        const vertexLen = vertexBytes(1);

        // Set up our attributes.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.worldVBO);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.worldEBO);
        gl.enableVertexAttribArray(this.world_lPos);
        gl.vertexAttribPointer(this.world_lPos, 3, gl.FLOAT, false, vertexLen, 0);
        gl.enableVertexAttribArray(this.world_lAtlasInfo);
        gl.vertexAttribPointer(this.world_lAtlasInfo, 4, gl.FLOAT, false, vertexLen, 12);
        gl.enableVertexAttribArray(this.world_lTexCoord);
        gl.vertexAttribPointer(this.world_lTexCoord, 2, gl.FLOAT, false, vertexLen, 28);
        gl.enableVertexAttribArray(this.world_lBright);
        gl.vertexAttribPointer(this.world_lBright, 3, gl.FLOAT, false, vertexLen, 36);

        // Bind the world atlas texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.worldTexAtlas);

        // Bind our sky camera data.
        const skyCam = createCamera(0, 0, 0);
        skyCam.dir = cam.dir;
        const skyView = getViewMatrix(skyCam);
        const viewLoc = gl.getUniformLocation(this.worldProg, "uView");
        if (viewLoc === null) {
            throw new Error('uView uniform location could not be found');
        }
        gl.uniformMatrix4fv(viewLoc, false, skyView);

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
        gl.uniformMatrix4fv(viewLoc, false, worldView);

        // Load our world data.
        gl.bufferData(gl.ARRAY_BUFFER, this.worldVerts, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.worldInds, gl.STATIC_DRAW);

        // Draw the world.
        gl.drawElements(gl.TRIANGLES, this.worldIndCount, gl.UNSIGNED_SHORT, 0);

        // Bind the sprite atlas texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTexAtlas);

        // Load our sprite data.
        gl.bufferData(gl.ARRAY_BUFFER, this.spriteVerts, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.spriteInds, gl.STATIC_DRAW);

        // Draw the sprites.
        gl.drawElements(gl.TRIANGLES, this.spriteIndCount, gl.UNSIGNED_SHORT, 0);

        // Cleanup.
        gl.disableVertexAttribArray(this.world_lPos);
        gl.disableVertexAttribArray(this.world_lAtlasInfo);
        gl.disableVertexAttribArray(this.world_lTexCoord);
        gl.disableVertexAttribArray(this.world_lBright);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}
