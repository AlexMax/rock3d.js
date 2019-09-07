/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { glMatrix, mat4, vec2, vec3 } from 'gl-matrix';

import { Atlas } from '../atlas';
import { Entity } from '../entity';
import { cacheFlats, Polygon } from '../level';
import { Camera, getViewMatrix } from './camera';
import { compileShader, linkShaderProgram } from './shader';
import { RenderContext } from './render';

import world_vert from './shader/world.vert';
import world_frag from './shader/world.frag';

const ATLAS_SIZE = 512;

/**
 * Return the number of bytes needed to hold the given number of vertexes.
 * 
 * @param count Number of vertexes to measure.
 */
function vertexBytes(count: number) {
    return count * 36;
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
function setVertex(buffer: ArrayBuffer, index: number, x: number, y: number,
    z: number, uAtOrigin: number, vAtOrigin: number, uAtLen: number,
    vAtLen: number, uTex: number, vTex: number): ArrayBuffer
{
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

    return buffer;
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

    spriteAtlas?: Atlas;
    spriteTexAtlas: WebGLTexture;
    spriteVerts: ArrayBuffer;
    spriteVertCount: number;
    spriteInds: Uint16Array;
    spriteIndCount: number;

    constructor(parent: RenderContext) {
        this.parent = parent;
        const gl = parent.gl;

        // Set up non-JS data.
        this.worldVerts = new ArrayBuffer(32768);
        this.worldVertCount = 0;
        this.worldInds = new Uint16Array(1024);
        this.worldIndCount = 0;
        this.worldProject = mat4.create();

        this.spriteVerts = new ArrayBuffer(32768);
        this.spriteVertCount = 0;
        this.spriteInds = new Uint16Array(1024);
        this.spriteIndCount = 0;

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
     */
    addWall(one: vec2, two: vec2, z1: number, z2: number, tex: string): void {
        if (this.worldAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Find the texture of the wall in the atlas
        let texEntry = this.worldAtlas.find(tex);

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

        // Draw a wall into the vertex and index buffers.
        //
        // Assuming you want to face the square head-on, xyz1 is the lower-left
        // coordinate and xyz2 is the upper-right coordinate.
        const vCount = this.worldVertCount;
        setVertex(this.worldVerts, vCount, one[0], one[1], z1, ua1, va1, ua2 - ua1, va2 - va1, ut1, vt2);
        setVertex(this.worldVerts, vCount + 1, two[0], two[1], z1, ua1, va1, ua2 - ua1, va2 - va1, ut2, vt2);
        setVertex(this.worldVerts, vCount + 2, two[0], two[1], z2, ua1, va1, ua2 - ua1, va2 - va1, ut2, vt1);
        setVertex(this.worldVerts, vCount + 3, one[0], one[1], z2, ua1, va1, ua2 - ua1, va2 - va1, ut1, vt1);

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
     */
    addFlatTessellation(verts: number[], inds: number[], z: number, tex: string): void {
        if (this.worldAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Find the texture of the flat in the atlas
        let texEntry = this.worldAtlas.find(tex);
        let ua1 = texEntry.xPos / this.worldAtlas.length;
        let va1 = texEntry.yPos / this.worldAtlas.length;
        let ua2 = (texEntry.xPos + texEntry.texture.width) / this.worldAtlas.length;
        let va2 = (texEntry.yPos + texEntry.texture.height) / this.worldAtlas.length;

        // Draw the triangle into the buffers.
        const vCountStart = this.worldVertCount;
        for (let i = 0;i < verts.length - 1;i += 2) {
            let vCount = this.worldVertCount;
            let ut = verts[i] / texEntry.texture.width;
            let vt = -(verts[i+1] / texEntry.texture.height);

            setVertex(this.worldVerts, vCount, verts[i], verts[i+1], z,
                ua1, va1, ua2 - ua1, va2 - va1, ut, vt);
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
     * @param polygon Set of polygon data to use while rendering.
     * @param index Polygon index to actually render.
     */
    addPolygon(polygons: Polygon[], index: number): void {
        const polygon = polygons[index];

        // Draw walls of the polygon
        for (let i = 0;i < polygon.sides.length;i++) {
            const side = polygon.sides[i];
            const nextVert = polygon.sides[(i + 1) % polygon.sides.length].vertex;

            // Is this a one-sided wall or a portal?
            if (typeof side.backPoly === 'number') {
                const backPoly = polygons[side.backPoly];
                if (polygon.ceilHeight > backPoly.ceilHeight && side.upperTex !== null ) {
                    this.addWall(side.vertex, nextVert, backPoly.ceilHeight, polygon.ceilHeight, side.upperTex);
                }
                if (polygon.floorHeight < backPoly.floorHeight && side.lowerTex !== null ) {
                    this.addWall(side.vertex, nextVert, polygon.floorHeight, backPoly.floorHeight, side.lowerTex);
                }
            } else {
                if (side.middleTex !== null) {
                    this.addWall(side.vertex, nextVert, polygon.floorHeight, polygon.ceilHeight, side.middleTex);
                }
            }
        }

        // Draw the floor and ceiling of the polygon
        if (polygon.cacheVerts.length === 0) {
            cacheFlats(polygon);
        }
        this.addFlatTessellation(polygon.cacheVerts, polygon.floorCacheInds,
            polygon.floorHeight, polygon.floorTex);
        this.addFlatTessellation(polygon.cacheVerts, polygon.ceilCacheInds,
            polygon.ceilHeight, polygon.ceilTex);
    }

    addEntity(entities: Entity[], index: number, cam: Camera): void {
        const entity = entities[index];
        const tex = 'PLAYA1';
        const z1 = 0; // Floor height
        const z2 = 64; // Ceiling height

        if (this.spriteAtlas === undefined) {
            throw new Error('Texture Atlas is empty');
        }

        // Billboard our sprite positions towards the camera.
        const view = getViewMatrix(cam);
        const worldRight = vec3.fromValues(view[0], view[4], view[8]);
        const worldUp = vec3.fromValues(view[1], view[5], view[9]);
        const spriteCenter = vec3.copy(vec3.create(), entity.pos);

        const spriteWidth = 41;
        const spriteHeight = 56;

        const lowerLeft = vec3.fromValues(-0.5, -0.5, 0);
        const upperRight = vec3.fromValues(0.5, 0.5, 0);

        const oneRight = vec3.copy(vec3.create(), worldRight);
        vec3.scale(oneRight, oneRight, lowerLeft[0]);
        vec3.scale(oneRight, oneRight, spriteWidth);
        const oneUp = vec3.copy(vec3.create(), worldUp);
        vec3.scale(oneUp, oneUp, lowerLeft[1]);
        vec3.scale(oneUp, oneUp, spriteHeight);
        const one3 = vec3.copy(vec3.create(), spriteCenter);
        vec3.add(one3, one3, oneRight);
        vec3.add(one3, one3, oneUp);

        const twoRight = vec3.copy(vec3.create(), worldRight);
        vec3.scale(twoRight, twoRight, upperRight[0]);
        vec3.scale(twoRight, twoRight, spriteWidth);
        const twoUp = vec3.copy(vec3.create(), worldUp);
        vec3.scale(twoUp, twoUp, upperRight[1]);
        vec3.scale(twoUp, twoUp, spriteHeight);
        const two3 = vec3.copy(vec3.create(), spriteCenter);
        vec3.add(two3, two3, twoRight);
        vec3.add(two3, two3, twoUp);

        const one = vec2.fromValues(one3[0], one3[1]);
        const two = vec2.fromValues(two3[0], two3[1]);

        // Find the texture of the wall in the atlas
        const texEntry = this.spriteAtlas.find(tex);

        const ua1 = texEntry.xPos / this.spriteAtlas.length;
        const va1 = texEntry.yPos / this.spriteAtlas.length;
        const ua2 = (texEntry.xPos + texEntry.texture.width) / this.spriteAtlas.length;
        const va2 = (texEntry.yPos + texEntry.texture.height) / this.spriteAtlas.length;

        const hDist = vec2.length(vec2.sub(vec2.create(), one, two));
        const vDist = z2 - z1;

        const ut1 = 0;
        const vt1 = 0;
        const ut2 = hDist / texEntry.texture.width;
        const vt2 = vDist / texEntry.texture.height;

        // Draw a sprite into the vertex and index buffers.
        //
        // Assuming you want to face the square head-on, xyz1 is the lower-left
        // coordinate and xyz2 is the upper-right coordinate.
        const vCount = this.spriteVertCount;
        setVertex(this.spriteVerts, vCount, one[0], one[1], z1, ua1, va1, ua2 - ua1, va2 - va1, ut1, vt2);
        setVertex(this.spriteVerts, vCount + 1, two[0], two[1], z1, ua1, va1, ua2 - ua1, va2 - va1, ut2, vt2);
        setVertex(this.spriteVerts, vCount + 2, two[0], two[1], z2, ua1, va1, ua2 - ua1, va2 - va1, ut2, vt1);
        setVertex(this.spriteVerts, vCount + 3, one[0], one[1], z2, ua1, va1, ua2 - ua1, va2 - va1, ut1, vt1);

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

        // Bind our camera data.
        const view = getViewMatrix(cam);
        const viewLoc = gl.getUniformLocation(this.worldProg, "uView");
        if (viewLoc === null) {
            throw new Error('uView uniform location could not be found');
        }
        gl.uniformMatrix4fv(viewLoc, false, view);

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

        // Bind the world atlas texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.worldTexAtlas);

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
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}
