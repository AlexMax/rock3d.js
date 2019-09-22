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

import {
    Entity, playerConfig, serializeEntity, SerializedEntity, unserializeEntity, moveRelative, rotateEuler
} from './entity';
import { Level } from './level';
import { LevelData } from './leveldata';
import { ClientCommand } from './proto';
import { checkButton, Button } from './command';

/**
 * Number of snapshots to store.
 */
const SNAPSHOT_MAX = 8;

/**
 * Number of commands to store.
 */
const COMMAND_MAX = 32;

export interface Snapshot {
    clock: number,
    entities: Map<number, Entity>;
}

export interface SerializedSnapshot {
    clock: number,
    entities: { [key: number]: SerializedEntity }
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
    return {
        clock: snap.clock,
        entities: serEntities,
    };
}

/**
 * Unserialize snapshot.
 * 
 * @param snap Snapshot data to unserialize.
 */
export const unserializeSnapshot = (snap: SerializedSnapshot): Snapshot => {
    const entities: Map<number, Entity> = new Map();
    for (let key in snap.entities) {
        const k = Number(key);
        const v = snap.entities[key];
        entities.set(k, unserializeEntity(v));
    }
    return {
        clock: snap.clock,
        entities: entities,
    };
}

/**
 * Set the contents of destination snapshot to source.
 */
const snapCopy = (dst: Snapshot, src: Snapshot) => {
    // Shallow copy our entities Map.
    dst.entities.clear();
    for (let [k, v] of src.entities) {
        dst.entities.set(k, v);
    }
}

/**
 * A map of client ID's and their command packet for a given tick.
 */
type Commands = Map<number, ClientCommand>;

/**
 * Contains all information that is relevant to the game over time.
 */
export class Simulation {

    /**
     * Period of one tick in milliseconds.
     */
    period: number;

    /**
     * Current level time, in ticks.
     */
    clock: number;

    /**
     * Original level data.
     */
    readonly level: Level;

    /**
     * Circular buffer of snapshots.
     */
    snapshots: Snapshot[];

    /**
     * Circular buffer of commands.
     */
    commands: Commands[];

    /**
     * Next Entity ID.
     */
    nextEntityID: number;

    /**
     * Keeps track of which player is tied to which entity.
     */
    players: Map<number, {
        state: 'connecting' | 'disconnecting' | 'ingame',
        entity: number | null,
    }>;

    /**
     * Construct the simulation.
     * 
     * @param data Level data to simulate.
     * @param tickrate Expected tickrate of simulation.
     * @param clock Initial clock of simulation.
     */
    constructor(data: LevelData, tickrate: number, clock: number) {
        this.period = 1000 / tickrate;
        this.clock = clock;
        this.level = new Level(data);
        this.snapshots = [];
        this.commands = [];
        for (let i = 0;i < SNAPSHOT_MAX;i++) {
            this.snapshots.push({
                clock: 0,
                entities: new Map()
            });
        }
        for (let i = 0;i < COMMAND_MAX;i++) {
            this.commands.push(new Map());
        }

        this.nextEntityID = 1;
        this.players = new Map();
    }

    /**
     * Add a player to the simulation.
     * 
     * Servers know about all players, local clients only know about themselves.
     * 
     * @param clientID Client ID to add.
     */
    addPlayer(clientID: number) {
        if (this.players.has(clientID)) {
            throw new Error(`Simulation already knows about player ${clientID}`);
        }
        this.players.set(clientID, {
            state: 'connecting', entity: null
        });
    }

    /**
     * Remove a player from the simulation.
     * 
     * @param clientID Client ID to remove.
     */
    removePlayer(clientID: number) {
        const player = this.players.get(clientID);
        if (player === undefined) {
            throw new Error(`Simulation does not know about player ${clientID}`);
        }
        this.players.set(clientID, {
            state: 'disconnecting', entity: player.entity
        });
    }

    /**
     * Get the entity belonging to a particular player.
     * 
     * @param clientID Client ID to look up.
     */
    getPlayerEntity(clientID: number) {
        const player = this.players.get(clientID);
        if (player === undefined) {
            return null;
        }
        return player.entity;
    }

    /**
     * Tick the simulation.
     */
    tick() {
        // Get our current snapshot.
        const currentSnapshot = this.clock % SNAPSHOT_MAX;
        const current: Readonly<Snapshot> = this.snapshots[currentSnapshot];
        if (current.clock !== this.clock) {
            throw new Error(`Unexpected clock in snapshot (expected ${this.clock}, got ${current.clock})`);
        }

        // Designate our target snapshot.
        const target = this.snapshots[(currentSnapshot + 1) % SNAPSHOT_MAX];

        // Copy our current snapshot into our target snapshot.
        snapCopy(target, current);
        target.clock = this.clock + 1;

        // Handle player connections and disconnections.
        for (let [k, v] of this.players) {
            if (v.state === 'connecting')  {
                // Create a player entity for the new player.
                target.entities.set(this.nextEntityID, {
                    config: playerConfig,
                    polygon: 0,
                    position: vec3.fromValues(0, 0, 0),
                    rotation: quat.fromEuler(quat.create(), 0, 0, 90),
                });
                this.players.set(k, {
                    state: 'ingame',
                    entity: this.nextEntityID,
                });
                this.nextEntityID += 1;
            } else if (v.state === 'disconnecting') {
                if (v.entity !== null) {
                    // Delete the player entity for the player.
                    target.entities.delete(v.entity);
                }
                this.players.delete(k);
            }
        }

        // For every connected player, check to see if we have commands
        // from them for this tick.
        //
        // FIXME: We should probably shift the order in which we resolve
        //        client commands every tick.
        const currentCommand = this.clock % COMMAND_MAX;
        for (let [k, v] of this.players) {
            const cmd = this.commands[currentCommand].get(k);
            if (cmd === undefined || cmd.clock !== this.clock) {
                if (cmd === undefined) {
                    //console.debug('No command');
                } else {
                    // console.debug('Stale command', cmd.clock, this.clock);
                }
                continue;
            }

            if (v.entity === null) {
                console.debug('Player entity is not set');
                continue;
            }

            const entity = target.entities.get(v.entity);
            if (entity === undefined) {
                console.debug('Player entity does not exist');
                continue;
            }

            if (checkButton(cmd.buttons, Button.WalkForward)) {
                const newEntity = moveRelative(entity, 8, 0, 0);
                target.entities.set(v.entity, newEntity);
            }

            if (checkButton(cmd.buttons, Button.WalkBackward)) {
                const newEntity = moveRelative(entity, -8, 0, 0);
                target.entities.set(v.entity, newEntity);
            }

            if (checkButton(cmd.buttons, Button.StrafeLeft)) {
                const newEntity = moveRelative(entity, 0, 8, 0);
                target.entities.set(v.entity, newEntity);
            }

            if (checkButton(cmd.buttons, Button.StrafeRight)) {
                const newEntity = moveRelative(entity, 0, -8, 0);
                target.entities.set(v.entity, newEntity);
            }

            if (cmd.pitch !== 0.0 || cmd.yaw !== 0.0) {
                const newEntity = rotateEuler(entity, 0, cmd.pitch, cmd.yaw);
                target.entities.set(v.entity, newEntity);
            }
        }

        // We're done with the tick, increase our clock.
        this.clock += 1;
    }

    /**
     * Update simulation with commands from a specific client.
     * 
     * @param clientID Client ID that these commands belong to.
     * @param cmd Client command data.
     */
    updateCommand(clientID: number, cmd: ClientCommand) {
        const currentCommand = cmd.clock % COMMAND_MAX;
        this.commands[currentCommand].set(clientID, cmd);
    }

    /**
     * Update the simulation with authoritative data for a given tick.
     */
    updateSnapshot(snap: Snapshot) {
        // Replace existing data with new data.
        snapCopy(this.snapshots[snap.clock % SNAPSHOT_MAX], snap);
    }

    /**
     * Return a serialized snapshot of state.
     */
    getSnapshot(): Readonly<Snapshot> {
        return this.snapshots[this.clock % SNAPSHOT_MAX];
    }
}
