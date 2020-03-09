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

import { quat, vec3 } from 'gl-matrix';

import { isObject, isThreeTuple, Mutable, Immutable } from './util';

export type MutableLocation = Mutable<{
    /**
     * Type of location, as a string.
     */
    type: string;

    /**
     * Entity config of spawners.
     */
    entityConfig?: string;

    /**
     * Polygon that the location is located inside.
     */
    polygon: number;

    /**
     * Position of the location.
     */
    position: Readonly<vec3>;

    /**
     * Rotation of the location.
     */
    rotation: Readonly<quat>;
}>;

/**
 * A Location.
 *
 * Represents a single point in the level.  It could be an Entity spawner
 * or some other type of vertex-driven data.
 */
export type Location = Immutable<MutableLocation>;

export interface SerializedLocation {
    type: string;
    entityConfig?: string;
    polygon: number;
    position: [number, number, number];
    rotation?: [number, number, number];
}

export function assertSerializedLocation(
    location: unknown
): asserts location is SerializedLocation {
    if (!isObject(location)) {
        throw new Error('location is not an object');
    }
    if (typeof location.type !== 'string') {
        throw new Error('location type is not a string');
    }
    // Entity Config is optional.
    if ("entityConfig" in location) {
        if (typeof location.entityConfig !== 'string') {
            throw new Error('location entity config is not a string');
        }
    }
    if (typeof location.polygon !== 'number') {
        throw new Error('location polygon is not a number');
    }
    if (!isThreeTuple(location.position, 'number')) {
        throw new Error('location position does not look like a three-tuple of number');
    }
    // Location is optional.
    if ("rotation" in location) {
        if (!isThreeTuple(location.rotation, 'number')) {
            throw new Error('location rotation does not look like a three-tuple of number');
        }
    }
}

export const unserializeLocation = (data: SerializedLocation): Location => {
    const rotation = data.rotation ? data.rotation : [0, 0, 0];
    return {
        type: data.type,
        entityConfig: data.entityConfig,
        polygon: data.polygon,
        position: vec3.fromValues(
            data.position[0], data.position[1], data.position[2]
        ),
        rotation: quat.fromEuler(
            quat.create(), rotation[0], rotation[1], rotation[2]
        ),
    };
}
