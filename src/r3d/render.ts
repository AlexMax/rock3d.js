/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { glMatrix, mat4, vec2 } from "gl-matrix";

import { Atlas } from '../atlas';
import { Camera, getViewMatrix } from './camera';
import * as Map from "../level";
import { Polygon } from '../level';

import world_vert from './shader/world.vert';
import world_frag from './shader/world.frag';
import debug_texture_vert from './shader/debug_texture.vert';
import debug_texture_frag from './shader/debug_texture.frag';

const ATLAS_SIZE = 512;

const DEBUG: boolean = false;

/**
 * Turn a WebGL GLenum into a string, for debugging purposes.
 * 
 * @param gl WebGL rendering context, which contains the enumerations.
 * @param num The enumeration to stringify.
 */
function glErrorString(gl: WebGLRenderingContext, num: GLenum): string {
    switch (num) {
    case gl.VERTEX_SHADER:
        return 'VERTEX_SHADER';
    case gl.FRAGMENT_SHADER:
        return 'FRAGMENT_SHADER';
    default:
        return '(unknown)';
    }
}

/**
 * Compile a shader safely, with a thrown exception if it doesn't compile
 * 
 * @param gl WebGL context
 * @param shaderType Shader type
 * @param source Source string
 */
function compileShader(gl: WebGLRenderingContext, shaderType: number, source: string): WebGLShader {
    const shader = gl.createShader(shaderType);
    if (shader === null) {
        throw new Error('Could not create shader object');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const status: GLboolean = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (status === false) {
        const log = gl.getShaderInfoLog(shader);
        throw new Error(`${glErrorString(gl, shaderType)} compile error:\n${log}`);
    }

    return shader;
}

/**
 * Link shaders into a shader program safely, throwing an exception if linking
 * fails
 * 
 * @param gl WebGL context
 * @param shaders Compiled shaders to link
 */
function linkShaderProgram(gl: WebGLRenderingContext, shaders: WebGLShader[]): WebGLProgram {
    const program = gl.createProgram();
    if (program === null) {
        throw new Error('Could not create program object');
    }

    for (let shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);

    const status: GLboolean = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (status === false) {
        const log = gl.getProgramInfoLog(program);
        throw new Error("Shader link error:\n" + log);
    }

    return program;
}

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

/**
 * Return an object containing vertex data.
 * 
 * This is primarily used for debugging, which is why the "set" function
 * takes parameters and not objects that this function is capable of returning.
 * 
 * @param buffer Source buffer for vertex data.
 * @param index In a buffer that can hold multiple vertexes, the number of
 *              vertexes that come before (in the data) the vertex you want
 *              to read.
 */
export function getVertex(buffer: ArrayBuffer, index: number): object {
    const view = new DataView(buffer, vertexBytes(index), vertexBytes(1));
    return {
        x: view.getFloat32(0, true),
        y: view.getFloat32(4, true),
        z: view.getFloat32(8, true),
        uAtOrigin: view.getFloat32(12, true),
        vAtOrigin: view.getFloat32(16, true),
        uAtLen: view.getFloat32(20, true),
        vAtLen: view.getFloat32(24, true),
        uTex: view.getFloat32(28, true),
        vTex: view.getFloat32(32, true),
    }
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

    constructor(parent: RenderContext) {
        this.parent = parent;
        const gl = parent.gl;

        // Set up non-JS data.
        this.worldVerts = new ArrayBuffer(32768);
        this.worldVertCount = 0;
        this.worldInds = new Uint16Array(1024);
        this.worldIndCount = 0;
        this.worldProject = mat4.create();

        // 3D shader program, used for rendering walls, floors and ceilings.
        const vs = compileShader(gl, gl.VERTEX_SHADER, world_vert);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, world_frag);

        this.worldProg = linkShaderProgram(gl, [vs, fs]);

        // We need a vertex buffer...
        const vbo = gl.createBuffer();
        if (vbo === null) {
            throw new Error('Could not allocate worldVBO');
        }
        this.worldVBO = vbo;

        // ...and an index buffer.
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
        const worldTextAtlas = gl.createTexture();
        if (worldTextAtlas === null) {
            throw new Error('Could not create texture atlas object');
        }
        this.worldTexAtlas = worldTextAtlas;
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
        gl.uniform1i(textureLoc, 0);

        // Upload a blank hot pink texture to the atlas.
        const blankAtlasTex = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
        for (let i = 0;i < blankAtlasTex.byteLength;i+=4) {
            blankAtlasTex[i] = 255;
            blankAtlasTex[i + 1] = 0;
            blankAtlasTex[i + 2] = 255;
            blankAtlasTex[i + 3] = 255;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_SIZE, ATLAS_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, blankAtlasTex);
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
            Map.cacheFlats(polygon);
        }
        this.addFlatTessellation(polygon.cacheVerts, polygon.floorCacheInds,
            polygon.floorHeight, polygon.floorTex);
        this.addFlatTessellation(polygon.cacheVerts, polygon.ceilCacheInds,
            polygon.ceilHeight, polygon.ceilTex);
    }

    /**
     * Persist the texture atlas onto the GPU using the current render context.
     * 
     * @param textures Texture atlas to bake.
     */
    bakeAtlas(textures: Atlas): void {
        // Copy the texture atlas into the render context
        this.worldAtlas = textures;

        // Get the texture atlas onto the GPU
        textures.persist((data, x, y) => {
            const gl = this.parent.gl;

            // FIXME: This is probably incredibly slow, but it works.

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

        // Bind the proper texture unit for our atlas.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.worldTexAtlas);

        // Load our data.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.worldVBO);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.worldEBO);
        gl.bufferData(gl.ARRAY_BUFFER, this.worldVerts, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.worldInds, gl.STATIC_DRAW);

        // Length of a single vertex.
        const vertexLen = vertexBytes(1);

        // Set up our attributes.
        gl.enableVertexAttribArray(this.world_lPos);
        gl.vertexAttribPointer(this.world_lPos, 3, gl.FLOAT, false, vertexLen, 0);
        gl.enableVertexAttribArray(this.world_lAtlasInfo);
        gl.vertexAttribPointer(this.world_lAtlasInfo, 4, gl.FLOAT, false, vertexLen, 12);
        gl.enableVertexAttribArray(this.world_lTexCoord);
        gl.vertexAttribPointer(this.world_lTexCoord, 2, gl.FLOAT, false, vertexLen, 28);

        // Draw everything.
        gl.drawElements(gl.TRIANGLES, this.worldIndCount, gl.UNSIGNED_SHORT, 0);

        // Cleanup.
        gl.disableVertexAttribArray(this.world_lPos);
        gl.disableVertexAttribArray(this.world_lAtlasInfo);
        gl.disableVertexAttribArray(this.world_lTexCoord);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}

export class DebugTextureContext {
    parent: RenderContext; // Reference to parent
    debugProg: WebGLProgram;
    debugVBO: WebGLBuffer;
    debug_lPos: GLuint;
    debug_lTex: GLuint;

    constructor(parent: RenderContext) {
        this.parent = parent;
        const gl = parent.gl;

        // Debug shader program, which simply renders a texture to screen.
        const vs = compileShader(gl, gl.VERTEX_SHADER, debug_texture_vert);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, debug_texture_frag);
        this.debugProg = linkShaderProgram(gl, [vs, fs]);

        // We need a vertex buffer...
        const vbo = gl.createBuffer();
        if (vbo === null) {
            throw new Error('Could not allocate debugVBO');
        }
        this.debugVBO = vbo;

        // Layout of our vertexes, as passed to the vertex shader.
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        // x, y and z positions.
        this.debug_lPos = gl.getAttribLocation(this.debugProg, 'lPos');
        if (this.debug_lPos === -1) {
            throw new Error('Could not find lPos in debug program');
        }
        // u and v texture coords.
        this.debug_lTex = gl.getAttribLocation(this.debugProg, 'lTex');
        if (this.debug_lTex === -1) {
            throw new Error('Could not find lTex in debug program');
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null); // So we don't modify the buffer

        // Assign the texture to the debug program.
        gl.useProgram(this.debugProg);
        const textureLoc = gl.getUniformLocation(this.debugProg, "uTexture");
        if (textureLoc === null) {
            throw new Error('uTexture uniform location could not be found');
        }
        gl.uniform1i(textureLoc, 0);
    }

    render(texture: WebGLTexture) {
        const gl = this.parent.gl;

        // Render our texture atlas to screen.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.useProgram(this.debugProg);

        const dVertexLen = 20;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.debugVBO);
        const vertexes = Float32Array.from([
            0.0, 0.0, 0.0, 1.0, 1.0,
            0.0, 1.0, 0.0, 1.0, 0.0,
            -1.0, 0.0, 0.0, 0.0, 1.0,
            -1.0, 1.0, 0.0, 0.0, 0.0
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertexes, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.debug_lPos);
        gl.vertexAttribPointer(this.debug_lPos, 3, gl.FLOAT, false, dVertexLen, 0);
        gl.enableVertexAttribArray(this.debug_lTex);
        gl.vertexAttribPointer(this.debug_lTex, 2, gl.FLOAT, false, dVertexLen, 12);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.disableVertexAttribArray(this.debug_lPos);
        gl.disableVertexAttribArray(this.debug_lTex);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

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
