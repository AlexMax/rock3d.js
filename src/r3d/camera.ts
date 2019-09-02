/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { mat4, quat, vec3 } from "gl-matrix";

export interface Camera {
    pos: vec3;
    dir: quat;
}

const forward = vec3.fromValues(0, 1, 0);
const right = vec3.fromValues(1, 0, 0);
const up = vec3.fromValues(0, 0, 1);

/**
 * Create a new camera.
 */
export function create(): Camera {
    const dir = quat.setAxes(quat.create(), forward, right, up);
    console.log(forward, right, up, dir);
    return {
        pos: vec3.create(),
        dir: dir,
    };
}

/**
 * Return a new camera object that was offset relative to the current camera
 * direction.
 * 
 * @param camera Camera to modify.
 * @param x Amount to sidestep left or right by.
 * @param y Amount to walk forwards or backwards by.
 * @param z Amount to raise or lower by.
 */
export function moveRelative(camera: Camera, x: number, y: number, z: number): Camera {
    const translation = vec3.fromValues(x, y, z);
    vec3.transformQuat(translation, translation, camera.dir);
    vec3.add(translation, translation, camera.pos);
    return {
        pos: translation,
        dir: camera.dir,
    };
}

/**
 * Return a new camera object that was offset relative to the current camera
 * direction.
 */
export function rotateRelative(camera: Camera, x: number, y:number, z: number): Camera {
    const dir = quat.setAxes(quat.create(), forward, right, up);
    console.log(forward, right, up, dir);
    // quat.rotateX(dir, dir, x);
    // quat.rotateY(dir, dir, y);
    // quat.rotateZ(dir, dir, z);

    return {
        pos: camera.pos,
        dir: dir,
    };
}

/**
 * Get a view matrix for looking through the Camera.
 */
export function getViewMatrix(camera: Camera) {
    const cameraMat = mat4.create();
    const position = vec3.fromValues(0, 0, 0);
    const target = vec3.fromValues(0, 1, 0);
    const up = vec3.fromValues(0, 0, 1);
    const rot = mat4.fromQuat(mat4.create(), camera.dir);
    console.log('rot', camera.dir);
    mat4.lookAt(cameraMat, position, target, up);
    mat4.multiply(cameraMat, cameraMat, rot);
    mat4.translate(cameraMat, cameraMat, vec3.fromValues(
        -camera.pos[0], -camera.pos[1], -camera.pos[2],
    ));
    return cameraMat;
}
