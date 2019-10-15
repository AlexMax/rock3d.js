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

export interface MutableLocation {
    /**
     * Type of location, as a string.
     */
    type: string;

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
    polygon: number;
    position: [number, number, number];
    rotation: [number, number, number];
}

export const isSerializedLocation = (
    location: SerializedLocation
): location is SerializedLocation => {
    if (typeof location.type !== 'string') {
        throw new Error('location type is not a string');
    }
    if (typeof location.polygon !== 'number') {
        throw new Error('location polygon is not a number');
    }
    if (!Array.isArray(location.position)) {
        throw new Error('location position is not an Array');
    }
    if (location.position.length !== 3) {
        throw new Error('location position does not look like a position');
    }
    if (typeof location.position[0] !== 'number' &&
        typeof location.position[1] !== 'number' &&
        typeof location.position[2] !== 'number') {
        throw new Error('location position does not consist of three numbers');
    }
    if (!Array.isArray(location.rotation)) {
        throw new Error('location rotation is not an Array');
    }
    if (location.rotation.length !== 3) {
        throw new Error('location rotation does not look like a rotation');
    }
    if (typeof location.rotation[0] !== 'number' &&
        typeof location.rotation[1] !== 'number' &&
        typeof location.rotation[2] !== 'number') {
        throw new Error('location rotation does not consist of three numbers');
    }
    return true;
}

export const unserializeLocation = (data: SerializedLocation): Location => {
    return {
        type: data.type,
        polygon: data.polygon,
        position: vec3.fromValues(
            data.position[0], data.position[1], data.position[2]
        ),
        rotation: quat.fromEuler(
            quat.create(), data.rotation[0],
            data.rotation[1], data.rotation[2]
        ),
    };
}
