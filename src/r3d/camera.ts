/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { mat4, quat, vec2, vec3 } from "gl-matrix";

import { constrain, rectOverlap, toEuler } from '../math';
import { flood, Level } from '../level';

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
export function create(x: number, y: number, z: number): Camera {
    const dir = quat.create();
    return {
        pos: vec3.fromValues(x, y, z),
        dir: dir,
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
 * Return a new camera object that is rotated relative to the current camera
 * direction.
 * 
 * @param camera Camera to modify.
 * @param x Amount to roll by.
 * @param y Amount to pitch by.
 * @param z Amount to yaw by.
 */
export function rotateEuler(camera: Camera, x: number, y: number, z: number): Camera {
    const euler = toEuler(vec3.create(), camera.dir);
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
export function rotateRelative(camera: Camera, x: number, y: number, z: number): Camera {
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
export function getViewMatrix(camera: Camera) {
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

function edgeToBoundingBox(viewMat: mat4, level: Level, poly: number, edge: number) {
    const source = level.polygons[poly]
    const first = source.edges[edge].vertex;
    const second = source.edges[(edge + 1) % source.edges.length].vertex;

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

/**
 * Determine which polygons are visible from the current camera position.
 * 
 * @param camera Camera to check visibility from.
 * @param project Projection matrix to flatten coordinates.
 * @param level Level to check.
 */
export function visiblePolygons(camera: Camera, project: mat4, level: Level): number[] {
    const viewMat = getViewMatrix(camera);
    const polyHash: Map<string, BoundingBox> = new Map();

    mat4.multiply(viewMat, project, viewMat);

    const visible = flood(level, 0, (level, checkPoly, checkEdge, sourcePoly, sourceEdge) => {
        const checkHash = checkPoly + '_' + checkEdge;

        if (sourcePoly === null) {
            // Create a bounding box from this current edge.
            polyHash.set(checkHash, edgeToBoundingBox(viewMat, level,
                checkPoly, checkEdge));

            // We always draw the polygon we're in.
            return true;
        }

        // Compare the source with our checked bounding box.
        const sourceHash = sourcePoly + '_' + sourceEdge;
        const sourceBox = polyHash.get(sourceHash);
        if (sourceBox === undefined) {
            throw new Error('Source polygon/edge is missing.');
        }
        const checkBox = edgeToBoundingBox(viewMat, level, checkPoly, checkEdge);

        // Save our checked box in the hash.
        polyHash.set(checkHash, checkBox);

        // Visibility depends on if bounding boxes for these edges overlap.
        return rectOverlap(sourceBox.origin, sourceBox.opposite,
                           checkBox.origin, checkBox.opposite);
    });

    return Array.from(visible);
}
