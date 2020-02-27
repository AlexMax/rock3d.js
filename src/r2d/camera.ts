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

import { mat3, vec2 } from "gl-matrix";

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
export const cameraCreate = (): Camera => {
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
export const cameraPan = (camera: Camera, x: number, y: number): Camera => {
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
export const cameraZoom = (canera: Camera, zoom: number): Camera => {
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
export const cameraGetViewMatrix = (camera: Camera): mat3 => {
    const scale = vec2.fromValues(camera.zoom, camera.zoom);
    const cameraMat = mat3.create();
    mat3.scale(cameraMat, cameraMat, scale);
    mat3.translate(cameraMat, cameraMat, vec2.fromValues(
        -camera.center[0], -camera.center[1]));
    return cameraMat;
}
