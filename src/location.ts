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

import { quat, vec3 } from 'gl-matrix';

import { isObject, isThreeTuple } from './util';

export interface MutableLocation {
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

    /**
     * Prevents accidental mutation of Location.
     */
    __mutable: true;
}

/**
 * A Location.
 *
 * Represents a single point in the level.  It could be an Entity spawner
 * or some other type of vertex-driven data.
 */
export type Location = Omit<Readonly<MutableLocation>, "__mutable">;

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
