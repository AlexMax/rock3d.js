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

import { quat, vec2, vec3 } from 'gl-matrix';

import { constrain, quatToEuler } from './math';

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
 * A mutable Entity.
 */
export interface MutableEntity {

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

    /**
     * Velocity.
     */
    velocity: vec3;

    /**
     * Prevents accidental mutation of Entity.
     */
    __mutable: true;
}

/**
 * An entity is an in-game object represented by a sprite that is not
 * considered part of the geometry of the level.
 */
export type Entity = Omit<Readonly<MutableEntity>, "__mutable">;

export const cloneEntity = (entity: Entity): MutableEntity => {
    return {
        ...entity,
    } as MutableEntity;
};

export interface SerializedEntity {
    config: string;
    polygon: number;
    position: [number, number, number];
    rotation: [number, number, number, number];
    velocity: [number, number, number];
}

/**
 * Convert native entity into JSON-friendly serialized entity.
 * 
 * @param entity Native entity to serialize.
 */
export const serializeEntity = (entity: Entity): SerializedEntity => {
    return {
        config: entity.config.name,
        polygon: entity.polygon,
        position: [
            entity.position[0], entity.position[1], entity.position[2],
        ],
        rotation: [
            entity.rotation[0], entity.rotation[1],
            entity.rotation[2], entity.rotation[3],
        ],
        velocity: [
            entity.velocity[0], entity.velocity[1], entity.velocity[2],
        ],
    };
}

/**
 * Convert serialized entity into native entity.
 * 
 * @param entity Serialized entity to unserialize.
 */
export const unserializeEntity = (entity: SerializedEntity): Entity => {
    return {
        config: playerConfig,
        polygon: entity.polygon,
        position: vec3.fromValues(...entity.position),
        rotation: quat.fromValues(...entity.rotation),
        velocity: vec3.fromValues(...entity.velocity),
    };
}

/**
 * Apply a force to an entity relative to its rotation.
 *
 * @param out Entity to mutate.
 * @param entity Entity to use as input.
 * @param force Force to apply in camera space.
 * @param cap Cap on force applied in camera space.
 */
export const forceRelativeXY = (
    out: MutableEntity, entity: Entity, force: vec2, cap: vec2
): MutableEntity => {
    // Constrain our force to the cap.  We can always apply force up to
    // the cap, but if we're going faster than the cap we don't want to
    // slow down.
    const invRotation = quat.invert(quat.create(), entity.rotation);
    const currentVelocity = vec3.transformQuat(
        vec3.create(), entity.velocity, invRotation
    );
    const newVelocity = vec3.create();
    newVelocity[0] = constrain(
        currentVelocity[0] + force[0], -cap[0], cap[0]
    ) - currentVelocity[0];
    newVelocity[1] = constrain(
        currentVelocity[1] + force[1], -cap[1], cap[1]
    ) - currentVelocity[1];
    console.log(currentVelocity, newVelocity);

    // Now that we have our desired new velocity, apply it.
    vec3.transformQuat(newVelocity, newVelocity, entity.rotation);
    vec3.add(newVelocity, newVelocity, entity.velocity);
    out.velocity = newVelocity;
    return out;
}

/**
 * Return a new entity that is rotated relative to its current rotation.
 * 
 * @param out Entity to mutate.
 * @param entity Entity to use as input.
 * @param x Amount to roll by.
 * @param y Amount to pitch by.
 * @param z Amount to yaw by.
 */
export const rotateEuler = (
    out: MutableEntity, entity: Entity, x: number, y: number, z: number
): MutableEntity => {
    const euler = quatToEuler(vec3.create(), entity.rotation);
    euler[0] += x;
    euler[1] = constrain(euler[1] + y, -89.999, 89.999);
    euler[2] += z;
    const newRot = quat.fromEuler(quat.create(), euler[0], euler[1], euler[2]);
    out.rotation = newRot;
    return out;
}
