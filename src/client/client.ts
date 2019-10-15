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

import { fromEntity } from '../r3d/camera';
import { isSerializedLevel } from '../level';
import * as proto from '../proto';
import { Simulation } from './sim';
import { unserializeSnapshot } from '../snapshot';
import { RenderContext } from '../r3d/render';

import TESTMAP from '../../asset/TESTMAP.json';

export interface Client {
    /**
     * Client ID.
     */
    id: number | null;

    /**
     * Round-trip-time to the server.
     */
    rtt: number | null;

    /**
     * Health of connection.
     */
    health: number | null;

    /**
     * Clientside (predicted) simulation.
     */
    sim: Simulation | null;
}

const hello = (client: Client, msg: proto.ServerHello) => {
    client.id = msg.clientID;
}

const ping = (client: Client, msg: proto.ServerPing) => {
    client.rtt = msg.rtt;
}

const snapshot = (client: Client, msg: proto.ServerSnapshot) => {
    const snap = unserializeSnapshot(msg.snapshot);
    if (client.sim === null) {
        if (!isSerializedLevel(TESTMAP)) {
            throw new Error('TESTMAP is not valid level data');
        }

        // Start the simulation now that we have snapshot data.
        client.sim = new Simulation(TESTMAP, 32, snap);
    }

    // Store our snapshot data in the simulation.
    client.sim.updateSnapshot(snap);

    // Store our latest commands in the simulation.
    client.sim.updateCommands(msg.commands);

    // Record our connection health.
    client.health = msg.health;
}

/**
 * Handle a server message.
 * 
 * @param client Client that is handling message.
 * @param msg Message contents.
 */
export const handleMessage = (client: Client, msg: proto.ServerMessage) => {
    // [AM] As far as I know, there's no easier way to do dynamic dispatch
    //      where each handler function is aware of its own message type.
    //      But I don't know for certain, patches welcome.
    switch (msg.type) {
        case proto.ServerMessageType.Hello:
            hello(client, msg);
            break;
        case proto.ServerMessageType.Ping:
            ping(client, msg);
            break;
        case proto.ServerMessageType.Snapshot:
            snapshot(client, msg);
            break;
        default:
            throw new Error('Unknown message');
    }
}

/**
 * Render the most up-to-date snapshot of the game.
 * 
 * This is _not_ handled inside the main game loop, it should usually
 * be called from an endless loop of requestAnimationFrame.
 */
export const render = (client: Client, ctx: RenderContext) => {
    if (client.id === null || client.sim === null) {
        return;
    }

    // Get our latest snapshot data to render.
    const snapshot = client.sim.getSnapshot();

    const camEntity = snapshot.players.get(client.id);
    if (camEntity === undefined) {
        // Player has no camera entity.
        return;
    }

    const entity = snapshot.entities.get(camEntity);
    if (entity === undefined) {
        // Entity we're trying to render doesn't exist.
        return;
    }

    const cam = fromEntity(entity);
    const level = client.sim.level;

    // Create our sky.
    ctx.world.clearSky();
    ctx.world.addSky('SKY1');

    // Add our geometry to be rendered.
    ctx.world.clearWorld();
    for (let i = 0;i < level.polygons.length;i++) {
        ctx.world.addPolygon(level, i);
    }

    // Add our sprites to be rendered.
    ctx.world.clearSprites();
    for (let [entityID, entity] of snapshot.entities) {
        if (entityID === camEntity) {
            // Don't draw your own sprite.
            continue;
        }

        ctx.world.addEntity(level, entity, cam);
    }

    // Render the world.
    ctx.world.render(cam);
}
