import { mat4, vec3 } from "gl-matrix";

export class Camera {
    pos: vec3;
    yaw: number;

    constructor() {
        this.pos = vec3.create();
        this.yaw = 0;
    }

    getViewMatrix(): mat4 {
        // Get a view matrix for looking through the Actor's eyes
        const cameraMat = mat4.create();
        const position = vec3.fromValues(0, 0, 0);
        const target = vec3.fromValues(0, 1, 0);
        const up = vec3.fromValues(0, 0, 1);
        mat4.lookAt(cameraMat, position, target, up);
        mat4.rotateZ(cameraMat, cameraMat, this.yaw);
        mat4.translate(cameraMat, cameraMat, vec3.fromValues(
            -this.pos[0], -this.pos[1], -this.pos[2],
        ));
        return cameraMat;
    }
};
