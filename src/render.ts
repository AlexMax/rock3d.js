import { glMatrix, mat4 } from "gl-matrix";

import { Camera } from "./camera";

import vertexShader from './shader/vert.glsl';
import fragmentShader from './shader/frag.glsl';

const ATLAS_SIZE = 512;

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
    if (shader == null) {
        throw new Error('Could not create shader object');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const status: GLboolean = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (status == false) {
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
    if (program == null) {
        throw new Error('Could not create program object');
    }

    for (let shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);

    const status: GLboolean = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (status == false) {
        const log = gl.getProgramInfoLog(program);
        throw new Error("Shader link error:\n" + log);
    }

    return program;
}

export class RenderContext {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    worldProg!: WebGLProgram; // Initialized in initWorldRenderer()
    worldTexAtlas!: WebGLTexture; // Initialized in initWorldRenderer()
    worldVerts!: ArrayBuffer; // Initialized in initWorldRenderer()
    worldInds!: Uint16Array; // Initialized in initWorldRenderer()
    worldProject: mat4;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // Attach context to canvas element.
        const gl = canvas.getContext("webgl");
        if (gl === null) {
            throw new Error("WebGL could not be initialized");
        }

        // GL Settings.
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        this.gl = gl;
        this.initWorldRenderer();

        this.worldProject = mat4.create();
        this.setProject(90);
    }

    /**
     * Initialize the renderer of the 3D world
     * 
     * This is where anything having to do with rendering the 3D world is set
     * up.  It's called by the constructor, you will never need to call this
     * yourself.
     */
    private initWorldRenderer(): void {
        const gl = this.gl;

        // 3D shader program, used for rendering walls, floors and ceilings.
        const vs = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

        this.worldProg = linkShaderProgram(gl, [vs, fs]);

        // We need a vertex buffer...
        const vbo = gl.createBuffer();
        if (vbo === null) {
            throw new Error('Could not allocate VBO buffer');
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        this.worldVerts = new ArrayBuffer(0);

        // ...and an index buffer.
        const ebo = gl.createBuffer();
        if (ebo === null) {
            throw new Error('Could not allocate EBO buffer');
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        this.worldInds = new Uint16Array(0);

        // Length of a single vertex
        const vertexLen = 12 + 16 + 8;

        // Layout of our vertexes, as passed to the vertex shader.
        // x, y, and z positions.
        const lPos = gl.getAttribLocation(this.worldProg, 'lPos');
        gl.vertexAttribPointer(lPos, 3, gl.FLOAT, false, vertexLen, 0);
        gl.enableVertexAttribArray(lPos);
        // u and v texture coordinates for the texture atlas.
        const lAtlasInfo = gl.getAttribLocation(this.worldProg, 'lAtlasInfo');
        gl.vertexAttribPointer(lAtlasInfo, 4, gl.FLOAT, false, vertexLen, 12);
        gl.enableVertexAttribArray(lAtlasInfo);
        // u and v texture coordinates for the texture itself.
        const lTexCoord = gl.getAttribLocation(this.worldProg, 'lTexCoord');
        gl.vertexAttribPointer(lTexCoord, 2, gl.FLOAT, false, vertexLen, 12 + 16);
        gl.enableVertexAttribArray(lTexCoord);

        // Set up the texture atlas texture
        const worldTextAtlas = gl.createTexture();
        if (worldTextAtlas == null) {
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
        gl.uniform1i(textureLoc, 0);

        // Upload a blank texture to the atlas
        const blankAtlasTex = new Uint8ClampedArray(ATLAS_SIZE * ATLAS_SIZE * 4);
        for (let i = 0;i < blankAtlasTex.byteLength;i++) {
            blankAtlasTex[i] = 255;
            blankAtlasTex[i + 1] = 0;
            blankAtlasTex[i + 2] = 255;
            blankAtlasTex[i + 3] = 255;
        }

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, ATLAS_SIZE, ATLAS_SIZE, 0, gl.RGBA, gl.UNSIGNED_BYTE, blankAtlasTex);
    }

    setProject(fov: number): void {
        // Setup the projection matrix
        mat4.perspective(this.worldProject, glMatrix.toRadian(fov), 800 / 500, 1, 10_000);

        // Make sure our projection matrix goes into the shader program
        const projectionLoc = this.gl.getUniformLocation(this.worldProg, "uProjection");
        this.gl.uniformMatrix4fv(projectionLoc, false, this.worldProject);
    }

    render(cam: Camera): void {
        const gl = this.gl;

        // Clear the buffer.
        gl.clearColor(0.0, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use the world program.
        gl.useProgram(this.worldProg);

        // Bind our camera data.
        const view = cam.getViewMatrix();
        const viewLoc = gl.getUniformLocation(this.worldProg, "uView");
        gl.uniformMatrix4fv(viewLoc, false, view);

        // Bind the proper texture unit for our atlas.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.worldTexAtlas);

        // Load our data.
        gl.bufferData(gl.ARRAY_BUFFER, this.worldVerts, gl.STATIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.worldInds, gl.STATIC_DRAW);

        // Draw everything.
        gl.drawElements(gl.TRIANGLES, this.worldInds.length, gl.UNSIGNED_SHORT, 0);
    }
}
