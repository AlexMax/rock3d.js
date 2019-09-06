/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { mat4 } from 'gl-matrix';

import { Atlas } from '../atlas';
import { compileShader, linkShaderProgram } from './shader';
import { RenderContext } from './render';

import sprite_vert from './shader/sprite.vert';
import sprite_frag from './shader/sprite.frag';

const ATLAS_SIZE = 512;

export class SpriteContext {
    parent: RenderContext; // Reference to parent

    spriteProg: WebGLProgram;
    spriteAtlas?: Atlas;
    spriteTexAtlas: WebGLTexture;
    spriteVBO: WebGLBuffer;
    spriteVerts: ArrayBuffer;
    spriteVertCount: number;
    spriteEBO: WebGLBuffer;
    spriteInds: Uint16Array;
    spriteIndCount: number;
    spriteProject: mat4;
    sprite_lPos: GLuint;
    sprite_lAtlasInfo: GLuint;
    sprite_lTexCoord: GLuint;

    constructor(parent: RenderContext) {
        this.parent = parent;
        const gl = parent.gl;

        // Set up non-JS data.
        this.spriteVerts = new ArrayBuffer(32768);
        this.spriteVertCount = 0;
        this.spriteInds = new Uint16Array(1024);
        this.spriteIndCount = 0;
        this.spriteProject = mat4.create();

        // 3D shader program, used for rendering walls, floors and ceilings.
        const vs = compileShader(gl, gl.VERTEX_SHADER, sprite_vert);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, sprite_frag);

        this.spriteProg = linkShaderProgram(gl, [vs, fs]);

        // We need a vertex buffer...
        const vbo = gl.createBuffer();
        if (vbo === null) {
            throw new Error('Could not allocate spriteVBO');
        }
        this.spriteVBO = vbo;

        // ...and an index buffer.
        const ebo = gl.createBuffer();
        if (ebo === null) {
            throw new Error('Could not allocate spriteEBO');
        }
        this.spriteEBO = ebo;

        // Keep track of our attributes.
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        // x, y, and z positions.
        this.sprite_lPos = gl.getAttribLocation(this.spriteProg, 'lPos');
        if (this.sprite_lPos === -1) {
            throw new Error('Could not find lPos in world program');
        }
        // u and v texture coordinates for the texture atlas.
        this.sprite_lAtlasInfo = gl.getAttribLocation(this.spriteProg, 'lAtlasInfo');
        if (this.sprite_lAtlasInfo === -1) {
            throw new Error('Could not find lAtlasInfo in world program');
        }
        // u and v texture coordinates for the texture itself.
        this.sprite_lTexCoord = gl.getAttribLocation(this.spriteProg, 'lTexCoord');
        if (this.sprite_lTexCoord === -1) {
            throw new Error('Could not find lTexCoord in world program');
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null); // So we don't modify the buffer

        // Set up the texture atlas texture
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
        gl.useProgram(this.spriteProg);
        const textureLoc = gl.getUniformLocation(this.spriteProg, "uTexture");
        if (textureLoc === null) {
            throw new Error('uTexture uniform location could not be found');
        }
        gl.uniform1i(textureLoc, 0);

        // Upload a blank hot pink transparent texture to the atlas.
        const blankAtlasTex = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
        for (let i = 0;i < blankAtlasTex.byteLength;i+=4) {
            blankAtlasTex[i] = 255;
            blankAtlasTex[i + 1] = 0;
            blankAtlasTex[i + 2] = 255;
            blankAtlasTex[i + 3] = 0;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_SIZE, ATLAS_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, blankAtlasTex);

        // Unbind texture so we don't accidentally mess with it.
        gl.bindTexture(gl.TEXTURE_2D, null);
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
}
