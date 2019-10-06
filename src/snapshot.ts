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

import * as cmd from './command';
import {
    Entity, serializeEntity, SerializedEntity, unserializeEntity,
    forceRelativeXY, rotateEuler, playerConfig
} from './entity';
import { cartesianToPolar } from './math';

export interface Snapshot {
    /**
     * Game clock of the snapshot.
     */
    clock: number,

    /**
     * Complete set of entities for this tick.
     */
    entities: Map<number, Entity>;

    /**
     * Next Entity ID to use.
     */
    nextEntityID: number,

    /**
     * Complete set of ingame players for this tick.
     * 
     * Key is client ID, value is the current entity ID commands should go to.
     */
    players: Map<number, number>;
}

export interface SerializedSnapshot {
    clock: number,
    entities: { [key: number]: SerializedEntity },
    nextEntityID: number,
    players: { [key: number]: number }
}

/**
 * Create an empty snapshot.
 */
export const createSnapshot = (): Snapshot =>  {
    return {
        clock: 0,
        entities: new Map(),
        nextEntityID: 1,
        players: new Map(),
    }
}

/**
 * Serialize snapshot
 * 
 * @param snap Snapshot data to serialize.
 */
export const serializeSnapshot = (snap: Snapshot): SerializedSnapshot => {
    const serEntities: { [key: number]: SerializedEntity } = {};
    for (let [k, v] of snap.entities) {
        serEntities[k] = serializeEntity(v);
    }
    const serPlayers: { [key: number]: number } = {};
    for (let [k, v] of snap.players) {
        serPlayers[k] = v;
    }
    return {
        clock: snap.clock,
        entities: serEntities,
        nextEntityID: snap.nextEntityID,
        players: serPlayers,
    };
}

/**
 * Unserialize snapshot.
 * 
 * @param snap Snapshot data to unserialize.
 */
export const unserializeSnapshot = (snap: SerializedSnapshot): Snapshot => {
    const snapEntities: Map<number, Entity> = new Map();
    for (let key in snap.entities) {
        const k = Number(key);
        const v = snap.entities[key];
        snapEntities.set(k, unserializeEntity(v));
    }
    const snapPlayers: Map<number, number> = new Map();
    for (let key in snap.players) {
        const k = Number(key);
        const v = snap.players[key];
        snapPlayers.set(k, v);
    }
    return {
        clock: snap.clock,
        entities: snapEntities,
        nextEntityID: snap.nextEntityID,
        players: snapPlayers,
    };
}

/**
 * Set the contents of destination snapshot to source.
 * 
 * @param dst Destination snapshot.
 * @param src Source snapshot.
 */
export const copySnapshot = (dst: Snapshot, src: Readonly<Snapshot>): Snapshot => {
    // Shallow copy our entities Map.
    dst.clock = src.clock;
    dst.entities.clear();
    for (let [k, v] of src.entities) {
        dst.entities.set(k, v);
    }
    dst.nextEntityID = src.nextEntityID;
    dst.players.clear();
    for (let [k, v] of src.players) {
        dst.players.set(k, v);
    }
    return dst;
}

const handleInput = (
    target: Snapshot, current: Readonly<Snapshot>,
    command: Readonly<cmd.InputCommand>, period: number
): void => {
    // Get entity ID for player entity.
    const entityID = target.players.get(command.clientID);
    if (entityID === undefined) {
        return;
    }

    // Get the commend entity.
    let entity = target.entities.get(entityID);
    if (entity === undefined) {
        return;
    }

    // Use inputs to rotate entity rotation.
    const input = command.input;
    if (input.pitch !== 0.0 || input.yaw !== 0.0) {
        entity = rotateEuler(entity, 0, input.pitch, input.yaw);
        target.entities.set(entityID, entity);
    }

    // Use our inputs to calculate desired force.
    //
    // Note that we are purposefully handling our axis separately
    // in order to allow straferunning.
    const force = vec2.create();
    if (cmd.checkButton(input, cmd.Button.WalkForward)) {
        force[0] += 8;
    }
    if (cmd.checkButton(input, cmd.Button.WalkBackward)) {
        force[0] -= 8;
    }
    if (cmd.checkButton(input, cmd.Button.StrafeLeft)) {
        force[1] += 8;
    }
    if (cmd.checkButton(input, cmd.Button.StrafeRight)) {
        force[1] -= 8;
    }
    if (force[0] !== 0 || force[1] !== 0) {
        entity = forceRelativeXY(entity, force);
        target.entities.set(entityID, entity);
    }
}

const handlePlayer = (
    target: Snapshot, current: Readonly<Snapshot>,
    command: Readonly<cmd.PlayerCommand>, period: number
): void => {
    switch (command.action) {
        case 'add':
            // Add a player to the player array.
            target.players.set(command.clientID, target.nextEntityID);

            // Create a new entity for the player.
            target.entities.set(target.nextEntityID, {
                config: playerConfig,
                polygon: 0,
                position: vec3.fromValues(0, 0, 0),
                rotation: quat.fromEuler(quat.create(), 0, 0, 90),
                velocity: vec3.fromValues(0, 0, 0),
            });
            target.nextEntityID += 1;
            break;
        case 'remove':
            // Get the Entity ID for the player.
            const entityID = target.players.get(command.clientID);
            if (entityID !== undefined) {
                // Delete the entity.
                target.entities.delete(entityID);
            }

            // Remove a player from the player array.
            target.players.delete(command.clientID);
            break;
    }
}

const handlePhysics = (
    target: Snapshot, current: Readonly<Snapshot>, period: number
): void => {
    for (let [entityID, entity] of target.entities) {
        if (entity.velocity[0] !== 0 || entity.velocity[1] !== 0) {
            target.entities.set(entityID, {
                ...entity,
                position: vec3.add(vec3.create(), entity.position, entity.velocity),
            })
        }
    }
}

/**
 * Tick a snapshot frame.
 * 
 * @param target Target snapshot frame.
 * @param current Current snapshot frame to tick.
 */
export const tickSnapshot = (
    target: Snapshot, current: Readonly<Snapshot>,
    commands: Readonly<cmd.Command[]>, period: number
): Snapshot  => {
    // Copy our current snapshot into our target snapshot.
    copySnapshot(target, current);
    target.clock = current.clock + 1;

    // Run our commands against the current frame, in the specified order.
    for (const command of commands) {
        switch (command.type) {
            case cmd.CommandTypes.Input:
                handleInput(target, current, command, period);
                break;
            case cmd.CommandTypes.Player:
                handlePlayer(target, current, command, period);
                break;
            default:
                throw new Error('Unknown message');
            }
    }

    // Run one tick worth of physics.
    handlePhysics(target, current, period);

    return target;
}
