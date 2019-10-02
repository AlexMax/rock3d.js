/**
 * rock3d.js: A 3D game engine with a retro heart.
 * Copyright (C) 2018-2019  Alex Mayfield <alexmax2742@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
export const create = (): Camera => {
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
export const pan = (camera: Camera, x: number, y: number): Camera => {
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
export const zoom = (canera: Camera, zoom: number): Camera => {
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
export const getViewMatrix = (camera: Camera): mat3 => {
    const scale = vec2.fromValues(camera.zoom, camera.zoom);
    const cameraMat = mat3.create();
    mat3.scale(cameraMat, cameraMat, scale);
    mat3.translate(cameraMat, cameraMat, vec2.fromValues(
        -camera.center[0], -camera.center[1]));
    return cameraMat;
}
