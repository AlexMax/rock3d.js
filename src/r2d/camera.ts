/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

import { mat3, vec2 } from "gl-matrix";
import { Camera } from "../r3d";

export interface Camera {
    /**
     * Location the camera is pointing at.
     */
    center: vec2;

    /**
     * Current zoom of the camera.
     */
    zoom: number;
}

/**
 * Create a new camera.
 */
export function create(): Camera {
    return {
        center: vec2.create(),
        zoom: 1.0,
    };
}

/**
 * Returns a new camera object that contains a different center.
 * 
 * @param camera Camera to modify.
 * @param x X amount to move camera by, assuming 1.0 zoom.
 * @param y Y amount to move camera by, assuming 1.0 zoom.
 */
export function pan(camera: Camera, x: number, y: number): Camera {
    camera.center[0] += (x * (1 / camera.zoom));
    camera.center[1] += (y * (1 / camera.zoom));

    // Return a new object so shallow object equality fails.
    return { ...camera };
}

/**
 * Returns a new camera object that contains a different zoom.
 * 
 * @param camera Camera to modify.
 * @param zoom Amount to modify zoom by.
 */
export function zoom(canera: Camera, zoom: number): Camera {
    // Return a new object so shallow object equality fails.
    return {
        center: canera.center,
        zoom: canera.zoom * zoom,
    };
}

/**
 * Get the view matrix of a given camera.
 * 
 * @param camera Camera to get view matrix for.
 */
export function getViewMatrix(camera: Camera): mat3 {
    const scale = vec2.fromValues(camera.zoom, camera.zoom);
    const cameraMat = mat3.create();
    mat3.scale(cameraMat, cameraMat, scale);
    mat3.translate(cameraMat, cameraMat, vec2.fromValues(
        -camera.center[0], -camera.center[1]));
    return cameraMat;
}
