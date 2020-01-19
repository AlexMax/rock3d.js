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
    forceRelativeXY, rotateEuler, cloneEntity, touchesFloor,
    MutableEntity, applyVelocity
} from './entity';
import { Level, MutableLevel, createEmptyLevel, copyLevel } from './level';
import { cartesianToPolar, polarToCartesian, quantize } from './math';
import {
    Mutator, serializeMutator, SerializedMutator, unserializeMutator,
    liftConfig
} from './mutator';
import { playerConfig, techPillarConfig } from './entityConfig';

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
 * Handle functionality that should be taken care of on level start.
 * 
 * @param snap Snapshot to mutate.
 * @param level Original unmodified level.
 */
const initLevel = (snap: Snapshot, level: Level): Snapshot => {
    // Iterate through our locations and spawn any necessary entities.
    for (const location of level.locations) {
        switch (location.type) {
        case 'tallTechPillar':
            snap.entities.set(snap.nextEntityID, {
                config: techPillarConfig,
                state: "spawn",
                stateClock: snap.clock,
                polygon: 0,
                position: vec3.clone(location.position),
                rotation: quat.fromEuler(
                    quat.create(), location.rotation[0], location.rotation[1],
                    location.rotation[2]
                ),
                velocity: vec3.fromValues(0, 0, 0),
            });
            snap.nextEntityID += 1;
            break;
        default:
            // Do nothing.
        }
    }
    return snap;
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
    let newEntity: undefined | MutableEntity = undefined;

    // Get our input
    const input = command.input;

    // Use inputs to rotate entity rotation.
    if (input.pitch !== 0.0 || input.yaw !== 0.0) {
        if (newEntity === undefined) {
            newEntity = cloneEntity(entity);
        }
        rotateEuler(
            newEntity, entity, 0, input.pitch, input.yaw
        );
    }

    // Modify our held buttons based on our inputs.
    heldButtons = cmd.updateButtons(heldButtons, input);
    snap.heldButtons.set(command.clientID, heldButtons);

    // Maximum force is based on the period.
    const maxSpeed = (512 * period) / 1000;
    const jumpSpeed = (256 * period) / 1000;
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
        if (newEntity === undefined) {
            newEntity = cloneEntity(entity);
        }
        forceRelativeXY(
            newEntity, entity, force, forceCap
        );
    }

    // Handle jumping.
    if (cmd.checkButton(heldButtons, cmd.Button.Jump)) {
        if (touchesFloor(entity, snap)) {
            if (newEntity === undefined) {
                newEntity = cloneEntity(entity);
            }
            newEntity.velocity[2] = jumpSpeed;
        }
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

    // If our entity was updated, set it in our snapshot.
    if (newEntity !== undefined) {
        snap.entities.set(entityID, newEntity);
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
                state: "spawn",
                stateClock: snap.clock,
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
    const gravity = (32 * period) / 1000;

    // Avoid garbage while iterating our entities.
    const polarVelocity: [number, number] = [0, 0];

    for (const [entityID, entity] of snap.entities) {
        // If we have velocity, apply it.
        if (!vec3.equals(entity.velocity, [0, 0, 0])) {
            // Apply our velocity.
            const newEntity = applyVelocity(cloneEntity(entity), entity, snap.level);

            // Any velocity we have in the X or Y direction is subject to
            // friction.  In order to properly calculate this lost speed
            // we need to work in polar coordinates.
            cartesianToPolar(
                polarVelocity, newEntity.velocity[0], newEntity.velocity[1]
            );
            polarVelocity[0] *= Math.pow(0.994813, period); // 0.85 at 32 ticrate
            polarToCartesian(
                newEntity.velocity, polarVelocity[0], polarVelocity[1]
            );

            // If entity isn't on the ground, add gravity.
            if (touchesFloor(newEntity, snap)) {
                newEntity.velocity[2] = 0;
            } else {
                newEntity.velocity[2] -= gravity;
            }

            // Quantize our velocity, if necessary.
            quantize(newEntity.velocity, newEntity.velocity);

            // Save our entities to the snapshot.
            snap.entities.set(entityID, newEntity);
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

    // On the first tic, we need to initialize the level.
    if (snap.clock === 0) {
        initLevel(out, level);
    }

    // Tick level mutators first, so entities can reason about their actual
    // position in the level.
    tickMutators(out, level, period);

    // Run our commands against the mutated level, in the specified order.
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

    // Tick entities in response to commands.
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
