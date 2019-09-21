/**
 * rock3d.js: A 3D rendering engine with a retro heart.
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

/**
 * A single frame of animation.
 */
interface Frame {
    /**
     * Name of the frame, added to the prefix.
     */
    frame: string;

    /**
     * Amount of time, in ms, to spend on the frame.
     */
    time: number;
}

/**
 * Possible animation states and their associated frame data.
 */
interface Animations {
    /**
     * Player/Monster is walking.  Loops forever.
     */
    walk: Frame[];
}

/**
 * Internal entity type definition.
 */
interface EntityConfig {
    /**
     * Name of the entity, for informational or debugging purposes.
     */
    name: string;

    /**
     * How high off the ground the camera is.
     */
    cameraZ: number;

    /**
     * Prefix string that all animations for this entity share.
     */
    spritePrefix: string;

    /**
     * True if this entity should be billboarded relative to the floor,
     * otherwise false if the entity should be billboarded on all axis.
     */
    grounded: boolean;

    /**
     * Animation states and frames.
     */
    animations: Animations;
}

/**
 * Player config.
 */
export const playerConfig: EntityConfig = {
    name: 'Player',
    cameraZ: 48,
    spritePrefix: 'PLAY',
    grounded: true,
    animations: {
        walk: [{
            frame: 'A',
            time: 112,
        }, {
            frame: 'B',
            time: 112,
        }, {
            frame: 'C',
            time: 112,
        }, {
            frame: 'D',
            time: 112,
        }],
    }
}

/**
 * An entity is a dynamic in-game object that is not considered part of
 * the geometry of the level.
 */
export interface Entity {

    /**
     * Static config of entity.
     */
    readonly config: EntityConfig;

    /**
     * Parent polygon ID.
     */
    polygon: number;

    /**
     * Position.
     */
    position: vec3;

    /**
     * Rotation.
     */
    rotation: quat;
}

export interface SerializedEntity {
    config: string;
    polygon: number;
    position: [number, number, number];
    rotation: [number, number, number, number];
}

export const serializeEntity = (entity: Entity): SerializedEntity => {
    return {
        config: entity.config.name,
        polygon: entity.polygon,
        position: [entity.position[0], entity.position[1], entity.position[2]],
        rotation: [
            entity.rotation[0], entity.rotation[1],
            entity.rotation[2], entity.rotation[3],
        ],
    };
}

export const unserializeEntity = (entity: SerializedEntity): Entity => {
    return {
        config: playerConfig,
        polygon: entity.polygon,
        position: vec3.fromValues(
            entity.position[0], entity.position[1], entity.position[2]),
        rotation: quat.fromValues(
            entity.rotation[0], entity.rotation[1],
            entity.rotation[2], entity.rotation[3])
    };
}
