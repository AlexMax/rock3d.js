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

import { Client } from './client';
import { unserializeSnapshot, Simulation } from '../sim';
import * as proto from '../proto';

import TESTMAP from '../../asset/TESTMAP.json';

const ping = (client: Client, msg: proto.ServerPing) => {
    client.rtt = msg.rtt;
}

const snapshot = (client: Client, msg: proto.ServerSnapshot) => {
    const snap = unserializeSnapshot(msg.snapshot);
    if (client.sim === null) {
        // Start the simulation now that we have snapshot data.
        client.sim = new Simulation(TESTMAP, 32, snap.clock);
    }

    // Store our snapshot data in the simulation.
    client.sim.updateSnapshot(snap);

    // Take note of which tick we most recently got server data for.
    if (client.authoritativeClock < snap.clock) {
        client.authoritativeClock = snap.clock;
    }
}

const camera = (client: Client, msg: proto.ServerCamera) => {
    client.camEntity = msg.id;
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
        case proto.ServerMessageType.Ping:
            ping(client, msg);
            break;
        case proto.ServerMessageType.Snapshot:
            snapshot(client, msg);
            break;
        case proto.ServerMessageType.Camera:
            camera(client, msg);
            break;
        default:
            throw new Error('Unknown message');
    }
}
