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
    forceRelativeXY, rotateEuler, playerConfig, cloneEntity, MutableEntity
} from './entity';
import { EdgeOverlay, Level, PolygonOverlay } from './level';
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
     * Complete set of polygon overlays for this tick.
     *
     * Key is polygon ID, value is ovarlaid polygon data.
     */
    polyOverlays: Map<number, PolygonOverlay>;

    /**
     * Complete set of edge overlays for this tick.
     *
     * Key is a string of polygon and edge ID separated by underscore,
     * value is overlaid edge data.
     */
    edgeOverlays: Map<number, EdgeOverlay>;
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
        polyOverlays: new Map(),
        edgeOverlays: new Map(),
    }
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
        polyOverlays: new Map(), // TODO: Implement.
        edgeOverlays: new Map(), // TODO: Implement.
    };
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

const handleInput = (
    target: Snapshot, command: Readonly<cmd.InputCommand>,
    period: number
): void => {
    // Get entity ID for player entity.
    const entityID = target.players.get(command.clientID);
    if (entityID === undefined) {
        return;
    }

    // Get current held buttons for player entity.
    let heldButtons = target.heldButtons.get(command.clientID);
    if (heldButtons === undefined) {
        return;
    }

    // Get the commend entity.
    let entity = target.entities.get(entityID);
    if (entity === undefined) {
        return;
    }

    const input = command.input;

    // Use inputs to rotate entity rotation.
    if (input.pitch !== 0.0 || input.yaw !== 0.0) {
        const newEntity = rotateEuler(
            cloneEntity(entity), entity, 0, input.pitch, input.yaw
        );
        target.entities.set(entityID, newEntity);
        entity = newEntity;
    }

    // Modify our held buttons based on our inputs.
    heldButtons = cmd.updateButtons(heldButtons, input);
    target.heldButtons.set(command.clientID, heldButtons);

    // Maximum force is based on the period.
    const maxSpeed = (1024 * period) / 1000;
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
        target.entities.set(entityID, newEntity);
        entity = newEntity;
    }

    // Handle "use" button.
    if (cmd.checkPressed(input, cmd.Button.Use)) {
        // Create a new mutator for the lift.
        target.mutators.set(target.nextMutatorID, {
            config: liftConfig,
            activated: target.clock,
        });
        target.nextMutatorID += 1;
    }
}

const handlePlayer = (
    target: Snapshot, command: Readonly<cmd.PlayerCommand>
): void => {
    switch (command.action) {
        case 'add':
            // Add a player to the player map.
            target.players.set(command.clientID, target.nextEntityID);

            // Create a new set of held buttons for player.
            target.heldButtons.set(command.clientID, 0);

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
        case 'remove': {
            // Get the Entity ID for the player.
            const entityID = target.players.get(command.clientID);
            if (entityID !== undefined) {
                // Delete the entity.
                target.entities.delete(entityID);
            }

            // Remove a player from the player array.
            target.players.delete(command.clientID);

            // Clear their held buttons.
            target.heldButtons.delete(command.clientID);
            break;
        }
    }
}

const tickMutators = (
    target: Snapshot, level: Readonly<Level>, period: number
): void => {
    for (const [mutatorID, mutator] of target.mutators) {
        mutator.config.think();
    }
}

const tickEntities = (
    target: Snapshot, level: Readonly<Level>, period: number
): void => {
    for (const [entityID, entity] of target.entities) {
        if (entity.velocity[0] !== 0 || entity.velocity[1] !== 0) {
            target.entities.set(entityID, {
                ...entity,
                velocity: vec3.scale(vec3.create(), entity.velocity, 0.9),
                position: vec3.add(vec3.create(), entity.position, entity.velocity),
            });
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
    commands: Readonly<cmd.Command[]>, level: Readonly<Level>, period: number
): Snapshot  => {
    // Copy our current snapshot into our target snapshot.
    copySnapshot(target, current);
    target.clock = current.clock + 1;

    // Run our commands against the current frame, in the specified order.
    for (const command of commands) {
        switch (command.type) {
            case cmd.CommandTypes.Input:
                handleInput(target, command, period);
                break;
            case cmd.CommandTypes.Player:
                handlePlayer(target, command);
                break;
            default:
                throw new Error('Unknown message');
            }
    }

    // Tick our mutators and entities, in that order.
    tickMutators(target, level, period);
    tickEntities(target, level, period);

    return target;
}
