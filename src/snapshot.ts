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
    forceRelativeXY, rotateEuler, playerConfig, cloneEntity
} from './entity';
import {
    Level, MutableLevel, createEmptyLevel, copyLevel
} from './level';
import { circleTouchesLine, quantize } from './math';
import {
    Mutator, serializeMutator, SerializedMutator, unserializeMutator,
    liftConfig
} from './mutator';

export interface Snapshot {
    /**
     * Game clock of the snapshot.
     */
    clock: number;

    /**
     * Complete set of entities for this tick.
     */
    entities: Map<number, Entity>;

    /**
     * Next Entity ID to use.
     */
    nextEntityID: number;

    /**
     * Complete set of mutators for this tick.
     */
    mutators: Map<number, Mutator>;

    /**
     * Next Mutator ID to use.
     */
    nextMutatorID: number;

    /**
     * Complete set of ingame players for this tick.
     * 
     * Key is client ID, value is the current entity ID commands should go to.
     */
    players: Map<number, number>;

    /**
     * Currently held buttons.
     * 
     * Key is client ID, value is button bitfield.
     */
    heldButtons: Map<number, number>;

    /**
     * Level state for snapshot.
     *
     * This is generated from the original level data based on mutators
     * run during the tick.  It is not serialized and starts out with a
     * fresh copy of the original level data at the start of every tick.
     */
    level: MutableLevel;
}

/**
 * Create an empty snapshot.
 */
export const createSnapshot = (): Snapshot =>  {
    return {
        clock: 0,
        entities: new Map(),
        nextEntityID: 1,
        mutators: new Map(),
        nextMutatorID: 1,
        players: new Map(),
        heldButtons: new Map(),
        level: createEmptyLevel(),
    }
}

/**
 * Set the contents of destination snapshot to source.
 * 
 * @param dst Destination snapshot.
 * @param src Source snapshot.
 */
export const copySnapshot = (dst: Snapshot, src: Readonly<Snapshot>): Snapshot => {
    dst.clock = src.clock;
    dst.nextEntityID = src.nextEntityID;
    dst.nextMutatorID = src.nextMutatorID;

    // Shallow copy our entities Map.
    dst.entities.clear();
    for (const [k, v] of src.entities) {
        dst.entities.set(k, v);
    }

    // Shallow copy our mutators Map.
    dst.mutators.clear();
    for (const [k, v] of src.mutators) {
        dst.mutators.set(k, v);
    }

    // Shallow copy our players Map.
    dst.players.clear();
    for (const [k, v] of src.players) {
        dst.players.set(k, v);
    }

    // Shallow copy our held buttons Map.
    dst.heldButtons.clear();
    for (const [k, v] of src.heldButtons) {
        dst.heldButtons.set(k, v);
    }

    return dst;
}

/**
 * Handle player joining and leaving.
 * 
 * @param snap Snapshot frame to tick.
 * @param command Input command to handle.
 * @param period Amount of time to tick in milliseconds.
 */
const handleInput = (
    snap: Snapshot, command: Readonly<cmd.InputCommand>,
    period: number
): void => {
    // Get entity ID for player entity.
    const entityID = snap.players.get(command.clientID);
    if (entityID === undefined) {
        return;
    }

    // Get current held buttons for player entity.
    let heldButtons = snap.heldButtons.get(command.clientID);
    if (heldButtons === undefined) {
        return;
    }

    // Get the commend entity.
    let entity = snap.entities.get(entityID);
    if (entity === undefined) {
        return;
    }

    const input = command.input;

    // Use inputs to rotate entity rotation.
    if (input.pitch !== 0.0 || input.yaw !== 0.0) {
        const newEntity = rotateEuler(
            cloneEntity(entity), entity, 0, input.pitch, input.yaw
        );
        snap.entities.set(entityID, newEntity);
        entity = newEntity;
    }

    // Modify our held buttons based on our inputs.
    heldButtons = cmd.updateButtons(heldButtons, input);
    snap.heldButtons.set(command.clientID, heldButtons);

    // Maximum force is based on the period.
    const maxSpeed = (512 * period) / 1000;
    const forceCap = vec2.fromValues(maxSpeed, maxSpeed);

    // Use our held buttons to calculate desired force.
    //
    // Note that we are purposefully handling our axis separately
    // in order to allow straferunning.
    const force = vec2.create();
    if (cmd.checkButton(heldButtons, cmd.Button.WalkForward)) {
        force[0] = maxSpeed / 4;
    }
    if (cmd.checkButton(heldButtons, cmd.Button.WalkBackward)) {
        force[0] = -maxSpeed / 4;
    }
    if (cmd.checkButton(heldButtons, cmd.Button.StrafeLeft)) {
        force[1] = maxSpeed / 4;
    }
    if (cmd.checkButton(heldButtons, cmd.Button.StrafeRight)) {
        force[1] = -maxSpeed / 4;
    }
    if (force[0] !== 0 || force[1] !== 0) {
        const newEntity = forceRelativeXY(
            cloneEntity(entity), entity, force, forceCap
        );
        snap.entities.set(entityID, newEntity);
        entity = newEntity;
    }

    // Handle "use" button.
    if (cmd.checkPressed(input, cmd.Button.Use)) {
        // Create a new mutator for the lift.
        snap.mutators.set(snap.nextMutatorID, {
            config: liftConfig,
            activated: snap.clock,
        });
        snap.nextMutatorID += 1;
    }
}

/**
 * Handle player joining and leaving.
 * 
 * @param snap Snapshot frame to tick.
 * @param command Player command to handle.
 */
const handlePlayer = (
    snap: Snapshot, command: Readonly<cmd.PlayerCommand>
): void => {
    switch (command.action) {
        case 'add':
            // Add a player to the player map.
            snap.players.set(command.clientID, snap.nextEntityID);

            // Create a new set of held buttons for player.
            snap.heldButtons.set(command.clientID, 0);

            // Create a new entity for the player.
            snap.entities.set(snap.nextEntityID, {
                config: playerConfig,
                polygon: 0,
                position: vec3.fromValues(0, 0, 0),
                rotation: quat.fromEuler(quat.create(), 0, 0, 90),
                velocity: vec3.fromValues(0, 0, 0),
            });
            snap.nextEntityID += 1;
            break;
        case 'remove': {
            // Get the Entity ID for the player.
            const entityID = snap.players.get(command.clientID);
            if (entityID !== undefined) {
                // Delete the entity.
                snap.entities.delete(entityID);
            }

            // Remove a player from the player array.
            snap.players.delete(command.clientID);

            // Clear their held buttons.
            snap.heldButtons.delete(command.clientID);
            break;
        }
    }
}

/**
 * Tick mutators in snapshot.
 * 
 * @param snap Snapshot frame to tick.
 * @param level Original level to use as a base.
 * @param period Amount of time to tick in milliseconds.
 */
const tickMutators = (snap: Snapshot, level: Level, period: number): void => {
    for (const [mutatorID, mutator] of snap.mutators) {
        mutator.config.think(snap, level, period);
    }
}

/**
 * Tick entities in snapshot.
 * 
 * @param snap Snapshot frame to tick.
 * @param period Amount of time to tick in milliseconds.
 */
const tickEntities = (snap: Snapshot, period: number): void => {
    for (const [entityID, entity] of snap.entities) {
        const newVelocity = vec3.clone(entity.velocity);

        // If entity isn't on the ground, add gravity.
        const poly = snap.level.polygons[entity.polygon];
        if (entity.config.grounded && entity.position[2] >= poly.floorHeight) {
            newVelocity[2] -= 1;
        } else {
            newVelocity[2] = 0;
        }

        // If we have velocity, apply it.
        if (!vec3.equals(newVelocity, [0, 0, 0])) {
            // Any velocity we have in the X or Y direction is subject to
            // friction.
            newVelocity[0] *= 0.9;
            newVelocity[1] *= 0.9;

            // Quantize our velocity, if necessary.
            quantize(newVelocity, newVelocity);

            // Initial position.
            const newPos = vec3.add(
                vec3.create(), entity.position, entity.velocity
            );

            // Collide the new position with walls of the current polygon.
            const touches = vec2.create();
            const edges = snap.level.polygons[entity.polygon].edgeIDs;
            for (let i = 0;i < edges.length;i++) {
                const edge = snap.level.edges[edges[i]];
                if (circleTouchesLine(
                    touches, edge.vertex, edge.nextVertex,
                    entity.position, 16
                ) !== null) {
                    // We hit a wall, undo our move and stop in in our tracks.
                    vec2.set(newVelocity, 0, 0);
                    vec2.copy(newPos, entity.position);
                }
            }

            snap.entities.set(entityID, {
                ...entity,
                velocity: newVelocity,
                position: newPos,
            });
        }
    }
}

/**
 * Tick a snapshot frame.
 * 
 * @param out Target snapshot frame.
 * @param snap Old snapshot frame to tick.
 * @param commands Array of commands to process.
 * @param level Level data to tick snapshot inside.
 * @param period Amount of time to tick in milliseconds.
 */
export const tickSnapshot = (
    out: Snapshot, snap: Readonly<Snapshot>,
    commands: Readonly<cmd.Command[]>, level: Level, period: number
): Snapshot  => {
    // Copy our current snapshot into our target snapshot.
    copySnapshot(out, snap);
    out.clock = snap.clock + 1;

    // Use passed level data to initialize mutated level cache.
    copyLevel(out.level, level);

    // Run our commands against the current frame, in the specified order.
    for (const command of commands) {
        switch (command.type) {
            case cmd.CommandTypes.Input:
                handleInput(out, command, period);
                break;
            case cmd.CommandTypes.Player:
                handlePlayer(out, command);
                break;
            default:
                throw new Error('Unknown message');
            }
    }

    // Tick our mutators and entities, in that order.
    tickMutators(out, level, period);
    tickEntities(out, period);

    return out;
}

export interface SerializedSnapshot {
    clock: number;
    entities: { [key: number]: SerializedEntity };
    nextEntityID: number;
    mutators: { [key: number]: SerializedMutator };
    nextMutatorID: number;
    players: { [key: number]: number };
    heldButtons: { [key: number]: number };
}

/**
 * Serialize snapshot
 * 
 * @param snap Snapshot data to serialize.
 */
export const serializeSnapshot = (snap: Snapshot): SerializedSnapshot => {
    const serEntities: { [key: number]: SerializedEntity } = {};
    for (const [k, v] of snap.entities) {
        serEntities[k] = serializeEntity(v);
    }
    const serMutators: { [key: number]: SerializedMutator } = {};
    for (const [k, v] of snap.mutators) {
        serMutators[k] = serializeMutator(v);
    }
    const serPlayers: { [key: number]: number } = {};
    for (const [k, v] of snap.players) {
        serPlayers[k] = v;
    }
    const serHeldButtons: { [key: number]: number } = {};
    for (const [k, v] of snap.heldButtons) {
        serHeldButtons[k] = v;
    }
    return {
        clock: snap.clock,
        entities: serEntities,
        nextEntityID: snap.nextEntityID,
        mutators: serMutators,
        nextMutatorID: snap.nextMutatorID,
        players: serPlayers,
        heldButtons: serHeldButtons,
    };
}

/**
 * Unserialize snapshot.
 * 
 * @param snap Snapshot data to unserialize.
 */
export const unserializeSnapshot = (snap: SerializedSnapshot): Snapshot => {
    const snapEntities: Map<number, Entity> = new Map();
    for (const key in snap.entities) {
        const k = Number(key);
        const v = snap.entities[key];
        snapEntities.set(k, unserializeEntity(v));
    }
    const snapMutators: Map<number, Mutator> = new Map();
    for (const key in snap.mutators) {
        const k = Number(key);
        const v = snap.mutators[key];
        snapMutators.set(k, unserializeMutator(v));
    }
    const snapPlayers: Map<number, number> = new Map();
    for (const key in snap.players) {
        const k = Number(key);
        const v = snap.players[key];
        snapPlayers.set(k, v);
    }
    const snapHeldButtons: Map<number, number> = new Map();
    for (const key in snap.heldButtons) {
        const k = Number(key);
        const v = snap.heldButtons[key];
        snapHeldButtons.set(k, v);
    }
    return {
        clock: snap.clock,
        entities: snapEntities,
        nextEntityID: snap.nextEntityID,
        mutators: snapMutators,
        nextMutatorID: snap.nextMutatorID,
        players: snapPlayers,
        heldButtons: snapHeldButtons,
        level: createEmptyLevel(),
    };
}
