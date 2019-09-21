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
    Entity, playerConfig, serializeEntity, SerializedEntity, unserializeEntity
} from './entity';
import { Level } from './level';
import { LevelData } from './leveldata';

const SNAPSHOT_MAX = 8;

export interface Snapshot {
    entities: Map<number, Entity>;
}

export interface SerializedSnapshot {
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

    constructor(data: LevelData, tickrate: number) {
        this.period = 1000 / tickrate;
        this.clock = 0;
        this.level = new Level(data);
        this.snapshots = [];
        for (let i = 0;i < SNAPSHOT_MAX;i++) {
            this.snapshots.push({
                entities: new Map()
            });
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
        const currentIndex = this.clock % SNAPSHOT_MAX;
        const current: Readonly<Snapshot> = this.snapshots[currentIndex];
        const target = this.snapshots[(currentIndex + 1) % SNAPSHOT_MAX];

        // Copy our current snapshot into our target snapshot.
        snapCopy(target, current);

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

            // We're done with the tick, increase our clock.
            this.clock += 1;
        }
    }

    /**
     * Update the simulation with authoritative data for a given tick.
     */
    update(clock: number, snap: Snapshot) {
        // For now, we just assume that all updates are always 100% correct
        // and just replace our existing data with new data, forcing the
        // clock forwards at the same time.
        this.clock = clock;
        snapCopy(this.snapshots[clock % SNAPSHOT_MAX], snap);
    }

    /**
     * Return a serialized snapshot of state.
     */
    getSnapshot(): Readonly<Snapshot> {
        const currentIndex = this.clock % SNAPSHOT_MAX;
        return this.snapshots[currentIndex];
    }
}
