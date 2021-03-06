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

import { glMatrix, quat, vec2, vec3 } from 'gl-matrix';

import {
    Level, findPolygon, entityTouchesLevel, isTouchNothing, isTouchVoid,
    isTouchEdge
} from './level';
import { constrain, quatToEuler } from './math';
import { Snapshot } from './snapshot';
import {
    getEntityConfig, EntityConfig, States, isValidState, entityBottom,
    entityTop
} from './entityConfig';
import { Mutable, Immutable, swizzle } from './util';

/**
 * A mutable Entity.
 */
export type MutableEntity = Mutable<{
    /**
     * Static config of entity.
     */
    readonly config: EntityConfig;

    /**
     * State that the entity is in.
     */
    state: States;

    /**
     * Base game clock that we entered this state on.
     */
    stateClock: number;

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
}>;

/**
 * An entity is an in-game object represented by a sprite that is not
 * considered part of the geometry of the level.
 */
export type Entity = Immutable<MutableEntity>;

export const cloneEntity = (entity: Entity): MutableEntity => {
    return {
        ...entity,
    } as MutableEntity;
};

export const copyEntity = (out: MutableEntity, entity: Entity): MutableEntity => {
    return Object.assign(out, entity);
};

export interface SerializedEntity {
    config: string;
    state: string;
    stateClock: number;
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
        state: entity.state,
        stateClock: entity.stateClock,
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
    if (!(isValidState(entity.state))) {
        throw new Error(`Invalid state ${entity.state} in serialized entity.`);
    }
    return {
        config: getEntityConfig(entity.config),
        state: entity.state,
        stateClock: entity.stateClock,
        polygon: entity.polygon,
        position: vec3.fromValues(...entity.position),
        rotation: quat.fromValues(...entity.rotation),
        velocity: vec3.fromValues(...entity.velocity),
    };
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
 * Apply partial velocity to entity.
 * 
 * @param out Entity to mutate.
 * @param entity Entity to use as input.
 * @param velocity Partial velocity to apply to entity.
 * @param level Level data to apply velocity inside.
 */
const applyPartialVelocity = (
    out: MutableEntity, entity: Entity, velocity: vec3, level: Level
): MutableEntity => {
    // Our new position, according to our velocity.
    const newPos = vec3.add(
        vec3.create(), entity.position, velocity
    );
    const newPosXY = swizzle(newPos, [0, 1]);

    // Find out which polygon this new position is inside.
    let newPolygon = findPolygon(level, entity.polygon, newPosXY);

    // Collide the new position with the level.
    let hitDest = entityTouchesLevel(
        level, entity.config, entity.velocity, newPos, newPolygon
    );

    if (isTouchVoid(hitDest)) {
        // We're going so fast that we've skipped past a wall into the void.
        // We cannot possibly reason about collision when an entity has no
        // parent polygon, so just stop the move right here.
        return out;
    }

    if (isTouchEdge(hitDest)) {
        // We hit a wall, figure out a new position.
        const normal = vec2.fromValues(
            newPos[0] - hitDest.position[0],
            newPos[1] - hitDest.position[1]
        );
        vec2.normalize(normal, normal);
        vec2.scale(normal, normal, entity.config.radius);
        vec2.add(newPosXY, hitDest.position, normal);
        newPolygon = findPolygon(level, entity.polygon, newPosXY);

        // Test sliding collision.
        hitDest = entityTouchesLevel(
            level, entity.config, entity.velocity, newPos, newPolygon
        );
        if (isTouchEdge(hitDest)) {
            // We slid into a wall, try and position our entity in the corner.
            const normal = vec2.fromValues(
                newPos[0] - hitDest.position[0],
                newPos[1] - hitDest.position[1]
            );
            vec2.normalize(normal, normal);
            vec2.scale(normal, normal, entity.config.radius);
            vec2.add(newPosXY, hitDest.position, normal);
            newPolygon = findPolygon(level, entity.polygon, newPosXY);

            // Test corner collision.
            hitDest = entityTouchesLevel(
                level, entity.config, entity.velocity, newPos, newPolygon
            );
            if (isTouchEdge(hitDest)) {
                // Stop the move completely.
                vec2.copy(newPosXY, swizzle(entity.position, [0, 1]));
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
        vec2.copy(newPosXY, swizzle(entity.position, [0, 1]));
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
    // Our collision detection tests entity positions against discrete
    // positions, and thus we are subject to the usual issues of small
    // entities passing through walls at high speeds.  However, due to the
    // way entities have a "parent" polygon, we run into trouble if entities
    // are travel faster than their radius in one tic, not just their diameter.
    //
    // Thus, to avoid issues, we dynamically break our movement into parts
    // based on the radius of the entity and the instantanious velocity of
    // the entity.
    const dist = Math.hypot(entity.velocity[0], entity.velocity[1]);
    let scale = entity.config.radius / dist;

    // Instead of being super-flexible, we can either process collision in
    // one, two our four pieces.  I don't want to break things into thirds
    // because it doesn't have a nice even power-of-two representation in
    // floating point.
    if (scale >= 1.0) {
        applyPartialVelocity(out, entity, out.velocity, level);
    } else if (scale >= 0.5) {
        const partialVelocity = vec3.scale(vec3.create(), entity.velocity, 0.5);
        applyPartialVelocity(out, entity, partialVelocity, level);
        applyPartialVelocity(out, out, partialVelocity, level);
    } else {
        const partialVelocity = vec3.scale(vec3.create(), entity.velocity, 0.25);
        applyPartialVelocity(out, entity, partialVelocity, level);
        applyPartialVelocity(out, out, partialVelocity, level);
        applyPartialVelocity(out, out, partialVelocity, level);
        applyPartialVelocity(out, out, partialVelocity, level);
    }

    return out;
}
