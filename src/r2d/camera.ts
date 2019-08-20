import { mat3, vec2 } from "gl-matrix";

export class Camera {
    center: vec2;
    zoom: number;

    constructor() {
        this.center = vec2.create();
        this.zoom = 1;
    }

    /**
     * Get a view matrix for looking straight at the center point
     */
    getViewMatrix(): mat3 {
        const scale = vec2.fromValues(0.5, 0.5);
        const cameraMat = mat3.create();
        mat3.translate(cameraMat, cameraMat, this.center);
        mat3.rotate(cameraMat, cameraMat, 0);
        mat3.scale(cameraMat, cameraMat, scale);
        return cameraMat;
    }
}
