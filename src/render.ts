import { Camera } from "./camera";

export class RenderContext {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    worldProg: WebGLProgram;

    constructor(canvas: HTMLCanvasElement) {
        // Attach context to canvas element
        this.gl = canvas.getContext("webgl");
        if (this.gl === null) {
            throw new Error("WebGL could not be initialized");
        }
    }

    render(cam: Camera): void {
        const gl = this.gl;

        // Clear the buffer
        gl.clearColor(0.0, 0.4, 0.4, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use the world program
        gl.useProgram(this.worldProg);
    }
}
