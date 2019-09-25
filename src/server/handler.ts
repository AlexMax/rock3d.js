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

import * as com from '../command';
import * as proto from '../proto';
import { Server } from './server';

/**
 * Client just joined the server.
 */
const hello = (server: Server, clientID: number, msg: proto.ClientHello) => {
    // Add an ingame player for the simulation.
    server.sim.queueCommand({
        type: com.CommandTypes.Player,
        clientID: clientID,
        action: 'add'
    });

    console.info({
        msg: "Joined the server",
        client: clientID,
        name: msg.name,
    })
};

/**
 * Command inputs from client.
 */
const input = (server: Server, clientID: number, msg: proto.ClientInput) => {
    server.sim.queueCommand({
        type: com.CommandTypes.Input,
        clientID: clientID,
        clock: msg.clock,
        buttons: msg.buttons,
        pitch: msg.pitch,
        yaw: msg.yaw,
    });
};

/**
 * Handle a client message.
 * 
 * @param server Server that is handling message.
 * @param clientID Client ID where message is coming from.
 * @param msg Message contents.
 */
export const handleMessage = (server: Server, clientID: number, msg: proto.ClientMessage) => {
    // [AM] As far as I know, there's no easier way to do dynamic dispatch
    //      where each handler function is aware of its own message type.
    //      But I don't know for certain, patches welcome.
    switch (msg.type) {
        case proto.ClientMessageType.Hello:
            hello(server, clientID, msg);
            break;
        case proto.ClientMessageType.Input:
            input(server, clientID, msg);
            break;
        default:
            console.warn({
                msg: "Unknown message",
                client: clientID,
            });
    }
};
