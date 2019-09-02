/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { mat4, quat, vec3 } from "gl-matrix";

export interface Camera {
    pos: vec3,
    dir: quat,
}

const unitForward = vec3.fromValues(0, 1, 0);
const unitRight = vec3.fromValues(1, 0, 0);
const unitUp = vec3.fromValues(0, 0, 1);

/**
 * Create a new camera.
 */
export function create(x: number, y: number, z: number): Camera {
    const dir = quat.create();
    return {
        pos: vec3.fromValues(x, y, z),
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
    const dir = quat.fromEuler(quat.create(), x, y, z);
    quat.multiply(dir, dir, camera.dir);

    return {
        pos: camera.pos,
        dir: dir,
    };
}

/**
 * Get a view matrix for looking through the Camera.
 */
export function getViewMatrix(camera: Camera) {
    const cameraMat = mat4.lookAt(mat4.create(), vec3.fromValues(0, 0, 0), unitForward, unitUp);
    const rot = quat.conjugate(quat.create(), camera.dir);
    const cameraRot = mat4.fromQuat(mat4.create(), rot);
    const trans = vec3.fromValues(-camera.pos[0], -camera.pos[1], -camera.pos[2]);
    const cameraTrans = mat4.fromTranslation(mat4.create(), trans);
    mat4.multiply(cameraMat, cameraMat, cameraRot);
    mat4.multiply(cameraMat, cameraMat, cameraTrans);
    return cameraMat;
}
