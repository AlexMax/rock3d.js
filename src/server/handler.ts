/*
 * rock3d.js: A 3D game engine for making retro FPS games
 * Copyright (C) 2018 Alex Mayfield <alexmax2742@gmail.com>
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

import * as cmd from '../command';
import * as proto from '../proto';
import { Server } from './server';

/**
 * Client just joined the server.
 */
const hello = (server: Server, clientID: number, msg: proto.ClientHello) => {
    // Tell the player what his Client ID is.
    const client = server.connections.get(clientID);
    if (client === undefined) {
        // Not really sure how this could possibly happen, don't add the player.
        return;
    }

    // Send the player his client ID.
    client.send({
        type: proto.ServerMessageType.Hello,
        clientID: clientID,
    });

    // Add an ingame player for the simulation.
    server.sim.queueCommand({
        type: cmd.CommandTypes.Player,
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
        type: cmd.CommandTypes.Input,
        clientID: clientID,
        clock: msg.clock,
        input: msg.input,
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
