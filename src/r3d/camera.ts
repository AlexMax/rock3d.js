/*
 * rock3d.js: A 3D game engine for making retro FPS games
 * Copyright (C) 2018 Alex Mayfield <alexmax2742@gmail.com>
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

import { mat4, quat, vec2, vec3 } from "gl-matrix";

import { Entity } from '../entity';
import { constrain, quatToEuler } from '../math';
import { Level } from '../level';

export interface Camera {
    pos: vec3,
    dir: quat,
}

const unitOrigin = vec3.fromValues(0, 0, 0);
const unitForward = vec3.fromValues(1, 0, 0);
const unitUp = vec3.fromValues(0, 0, 1);

/**
 * Create a new camera.
 */
export const createCamera = (x: number, y: number, z: number): Camera => {
    const dir = quat.create();
    return {
        pos: vec3.fromValues(x, y, z),
        dir: dir,
    };
}

/**
 * Create a camera from an entity.
 * 
 * @param entity Entity to create camera from.
 */
export const fromEntity = (entity: Entity): Camera => {
    // Default camera height is 16 below the height of it.
    // FIXME: Should the default of non-grounded entities be half the height?
    const cameraHeight = entity.config.cameraHeight ?
        entity.config.cameraHeight : entity.config.height - 16;
    return {
        pos: vec3.fromValues(
            entity.position[0],
            entity.position[1],
            entity.position[2] + cameraHeight),
        dir: quat.clone(entity.rotation),
    };
}

/**
 * Return a new camera object that is offset relative to the current camera
 * direction.
 * 
 * @param camera Camera to modify.
 * @param x Amount to sidestep left or right by.
 * @param y Amount to walk forwards or backwards by.
 * @param z Amount to raise or lower by.
 */
export const moveRelative = (
    camera: Camera, x: number, y: number, z: number
): Camera => {
    const translation = vec3.fromValues(x, y, z);
    vec3.transformQuat(translation, translation, camera.dir);
    vec3.add(translation, translation, camera.pos);
    return {
        pos: translation,
        dir: camera.dir,
    };
}

/**
 * Return a new camera object that is rotated relative to the current camera
 * direction.
 * 
 * @param camera Camera to modify.
 * @param x Amount to roll by.
 * @param y Amount to pitch by.
 * @param z Amount to yaw by.
 */
export const rotateEuler = (
    camera: Camera, x: number, y: number, z: number
): Camera => {
    const euler = quatToEuler(vec3.create(), camera.dir);
    euler[0] += x;
    euler[1] = constrain(euler[1] + y, -89.999, 89.999);
    euler[2] += z;
    const dir = quat.fromEuler(quat.create(), euler[0], euler[1], euler[2]);
    return {
        pos: camera.pos,
        dir: dir,
    };
}

/**
 * Return a new camera object that is rotated relative to the current camera
 * direction.
 * 
 * @param camera Camera to modify.
 * @param x Amount to roll by.
 * @param y Amount to pitch by.
 * @param z Amount to yaw by.
 */
export const rotateRelative = (
    camera: Camera, x: number, y: number, z: number
): Camera => {
    const dir = quat.fromEuler(quat.create(), x, y, z);
    quat.multiply(dir, camera.dir, dir);
    return {
        pos: camera.pos,
        dir: dir,
    };
}

/**
 * Get a view matrix for looking through the Camera.
 */
export const getViewMatrix = (camera: Camera) => {
    const cameraMat = mat4.lookAt(mat4.create(), unitOrigin, unitForward, unitUp);
    const rot = quat.conjugate(quat.create(), camera.dir);
    const cameraRot = mat4.fromQuat(mat4.create(), rot);
    const trans = vec3.fromValues(-camera.pos[0], -camera.pos[1], -camera.pos[2]);
    const cameraTrans = mat4.fromTranslation(mat4.create(), trans);
    mat4.multiply(cameraMat, cameraMat, cameraRot);
    mat4.multiply(cameraMat, cameraMat, cameraTrans);
    return cameraMat;
}

interface BoundingBox {
    origin: vec2,
    opposite: vec2,
}

const edgeToBoundingBox = (
    viewMat: mat4, level: Level, poly: number, edgeID: number
) => {
    const source = level.polygons[poly]
    const edge = level.edges[edgeID];
    const first = edge.vertex;
    const second = edge.nextVertex;

    const verts: vec3[] = [
        vec3.fromValues(first[0], first[1], source.floorHeight),
        vec3.fromValues(second[0], second[1], source.floorHeight),
        vec3.fromValues(first[0], first[1], source.ceilHeight),
        vec3.fromValues(second[0], second[1], source.ceilHeight),
    ];

    // World to Clip space, which is also NDC because w is 1.
    for (let i = 0;i < verts.length;i++) {
        vec3.transformMat4(verts[i], verts[i], viewMat);
    }

    // Create a bounding box with the minimum and maximum values.
    return {
        origin: vec2.fromValues(
            Math.min(verts[0][0], verts[1][0], verts[2][0], verts[3][0]),
            Math.min(verts[0][1], verts[1][1], verts[2][1], verts[3][1])),
        opposite: vec2.fromValues(
            Math.max(verts[0][0], verts[1][0], verts[2][0], verts[3][0]),
            Math.max(verts[0][1], verts[1][1], verts[2][1], verts[3][1])),
    }
}
