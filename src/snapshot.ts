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

import {
    Entity, serializeEntity, SerializedEntity, unserializeEntity, moveRelative,
    rotateEuler
} from './entity';
import { Button, checkButton, Command } from './command';

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
const snapCopy = (dst: Snapshot, src: Readonly<Snapshot>): Snapshot => {
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

/**
 * Tick a snapshot frame.
 * 
 * @param target Target snapshot frame.
 * @param current Current snapshot frame to tick.
 */
export const tick = (
    target: Snapshot, current: Readonly<Snapshot>,
    commands: Readonly<Command[]>
): Snapshot  => {
    // Copy our current snapshot into our target snapshot.
    snapCopy(target, current);
    target.clock = current.clock + 1;

    // Run our commands against the current frame, in the specified order.
    for (const cmd of commands) {
        // Get entity of player
        const entityID = target.players.get(cmd.clientID);
        if (entityID === undefined) {
            continue;
        }

        // Get the commend entity.
        const entity = target.entities.get(entityID);
        if (entity === undefined) {
            continue;
        }

        if (checkButton(cmd.buttons, Button.WalkForward)) {
            const newEntity = moveRelative(entity, 8, 0, 0);
            target.entities.set(entityID, newEntity);
        }

        if (checkButton(cmd.buttons, Button.WalkBackward)) {
            const newEntity = moveRelative(entity, -8, 0, 0);
            target.entities.set(entityID, newEntity);
        }

        if (checkButton(cmd.buttons, Button.StrafeLeft)) {
            const newEntity = moveRelative(entity, 0, 8, 0);
            target.entities.set(entityID, newEntity);
        }

        if (checkButton(cmd.buttons, Button.StrafeRight)) {
            const newEntity = moveRelative(entity, 0, -8, 0);
            target.entities.set(entityID, newEntity);
        }

        if (cmd.pitch !== 0.0 || cmd.yaw !== 0.0) {
            const newEntity = rotateEuler(entity, 0, cmd.pitch, cmd.yaw);
            target.entities.set(entityID, newEntity);
        }
    }

    return target;
}
