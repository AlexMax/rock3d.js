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

import { glMatrix, quat, vec2, vec3 } from 'gl-matrix';

import {
    Level, findPolygon, entityTouchesLevel, isTouchNothing, isTouchVoid,
    isTouchEdge
} from './level';
import { constrain, quatToEuler } from './math';
import { Snapshot } from './snapshot';

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
export interface EntityConfig {
    /**
     * Name of the entity, for informational or debugging purposes.
     */
    name: string;

    /**
     * Radius of the entity.
     */
    radius: number;

    /**
     * Height of the entity.
     */
    height: number;

    /**
     * How high off the ground the camera is.
     */
    cameraHeight: number;

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
    radius: 16,
    height: 56,
    cameraHeight: 48,
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
 * Bottom boundary of an entity.
 *
 * @param config Configuration of entity.
 * @param pos Position of entity.
 */
export const entityBottom = (config: EntityConfig, pos: vec3): number => {
    if (config.grounded === true) {
        return pos[2];
    }
    return pos[2] - config.height / 2;
}

/**
 * Top boundary of an entity.
 *
 * @param config Configuration of entity.
 * @param pos Position of entity.
 */
export const entityTop = (config: EntityConfig, pos: vec3): number => {
    if (config.grounded === true) {
        return pos[2] + config.height;
    }
    return pos[2] + config.height / 2;
}

/**
 * Check to see if this entity is touching the floor.
 *
 * @param entity Entity to check.
 */
export const touchesFloor = (entity: Entity, snap: Snapshot): boolean => {
    const poly = snap.level.polygons[entity.polygon];
    if (entity.config.grounded && entity.position[2] <= poly.floorHeight) {
        return true;
    }
    return false;
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

    // Rotate velocity so we can operate on it.
    const entityAngle = glMatrix.toRadian(
        quatToEuler(vec3.create(), entity.rotation)[2]
    );
    const newVelocity = vec3.rotateZ(
        vec3.create(), entity.velocity,
        vec3.create(), -entityAngle
    );

    // Add our contrained force to our existing XY velocity.
    newVelocity[0] = constrain(
        newVelocity[0] + force[0], -cap[0], cap[0]
    );
    newVelocity[1] = constrain(
        newVelocity[1] + force[1], -cap[1], cap[1]
    );

    // Rotate our velocity back to what it was.
    vec3.rotateZ(newVelocity, newVelocity, vec3.create(), entityAngle);

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

/**
 * Apply stored velocity to entity.
 * 
 * @param out Entity to mutate.
 * @param entity Entity to use as input.
 * @param level Level data to apply velocity inside.
 */
export const applyVelocity = (
    out: MutableEntity, entity: Entity, level: Level
): MutableEntity => {
    // Our new position, according to our velocity.
    const newPos = vec3.add(
        vec3.create(), entity.position, entity.velocity
    );

    // Find out which polygon this new position is inside.
    let newPolygon = findPolygon(level, entity.polygon, newPos);

    // Collide the new position with the level.
    let hitDest = entityTouchesLevel(
        level, entity.config, newPos, newPolygon
    );
    if (isTouchEdge(hitDest)) {
        // We hit the wall, figure out a new position along the wall that
        // will slide the player against it.
        const edge = level.edges[hitDest.edgeID];
        const normal = vec2.normalize(vec2.create(), edge.normalCache as vec2);
        vec2.scale(normal, normal, entity.config.radius);
        vec2.add(newPos, hitDest.position, normal);
        newPolygon = findPolygon(level, entity.polygon, newPos);

        // Test sliding collision.
        hitDest = entityTouchesLevel(
            level, entity.config, newPos, newPolygon
        );
        if (isTouchEdge(hitDest)) {
            // We slid into a wall, try and position our entity in the corner.
            const edge = level.edges[hitDest.edgeID];
            const normal = vec2.normalize(vec2.create(), edge.normalCache as vec2);
            vec2.scale(normal, normal, entity.config.radius);
            vec2.add(newPos, hitDest.position, normal);
            newPolygon = findPolygon(level, entity.polygon, newPos);

            // Test corner collision.
            hitDest = entityTouchesLevel(
                level, entity.config, newPos, newPolygon
            );
            if (isTouchEdge(hitDest)) {
                // Stop the move completely.
                vec2.copy(newPos, entity.position);
                newPolygon = entity.polygon;
            }
        }
    }

    if (isTouchNothing(hitDest)) {
        // Our move is valid, but we might need to adjust our entity's
        // position because of floor/ceiling heights.
        for (const polyID of hitDest.insidePolys) {
            const poly = level.polygons[polyID];

            // Push up through floor.
            const bottom = entityBottom(entity.config, newPos);
            if (poly.floorHeight > bottom) {
                newPos[2] = poly.floorHeight;
            }

            // Push down through ceiling.
            const top = entityTop(entity.config, newPos);
            if (poly.ceilHeight < top) {
                newPos[2] = poly.ceilHeight - entity.config.height;
            }
        }
    }

    if (isTouchVoid(hitDest)) {
        // We ended up in the void, undo whatever move we made.
        vec2.copy(newPos, entity.position);
        newPolygon = entity.polygon;
    }

    if (newPolygon === null) {
        // How did we end up here?
        throw new Error('Entity has left Polygon boundary - I\'m Free!');
    }

    out.position = newPos;
    out.polygon = newPolygon;
    return out;
}
