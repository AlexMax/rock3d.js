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

/**
 * This contains the complete wire protocol of both the client and the server.
 * It also doubles as a sort of expected protocol of the schema.
 */

import { Input, Command } from './command';
import { SerializedSnapshot } from './snapshot';

/**
 * Possible client messages.
 */
export enum ClientMessageType {
    /**
     * Greeting from the client, should be the first thing sent.
     */
    Hello,

    /**
     * Inputs from the client.
     */
    Input,
}

export interface ClientHello {
    type: ClientMessageType.Hello;

    /**
     * Name of the player.
     */
    name: string;
}

export interface ClientInput {
    type: ClientMessageType.Input;

    /**
     * Predicted clock of client message.
     */
    clock: number;

    /**
     * Input of client.
     */
    input: Input;
}

export type ClientMessage = ClientHello | ClientInput;

/**
 * Serialize a client message into JSON.
 * 
 * @param message Message to pack.
 */
export const packClient = (message: ClientMessage): string => {
    const encoded = JSON.stringify(message);
    return encoded;
}

/**
 * Unserialize a client message into an object.
 * 
 * @param message Message to unpack.
 */
export const unpackClient = (message: string): ClientMessage => {
    const decoded = JSON.parse(message);
    return decoded;
};

/**
 * Possible server messages.
 */
export enum ServerMessageType {
    /**
     * Greet a newly-connecting player.
     */
    Hello,

    /**
     * Tell the client how far away they are from the server.
     */
    Ping,

    /**
     * Game data sent from the server.
     */
    Snapshot,
}

export interface ServerHello {
    type: ServerMessageType.Hello;

    /**
     * Entity ID.
     */
    clientID: number;
}

export interface ServerPing {
    type: ServerMessageType.Ping;

    /**
     * Round-trip-time, in milliseconds.
     */
    rtt: number;
}

export interface ServerSnapshot {
    type: ServerMessageType.Snapshot;

    /**
     * Snapshot data.
     */
    snapshot: SerializedSnapshot;

    /**
     * Commands used to create this snapshot.
     */
    commands: Readonly<Command[]>;

    /**
     * How "even" the client's commands are with the server.
     * 
     * This number should be as close to 0 as reasonable.  Negative numbers
     * indicate input buffer starvation, positive numbers indicate buffer
     * bloat, null means we don't have any inputs to tell yet.
     */
    health: number | null;
}

export type ServerMessage = ServerHello | ServerPing | ServerSnapshot;

/**
 * Serialize a server message into JSON.
 * 
 * @param message Message to pack.
 */
export const packServer = (message: ServerMessage): string => {
    const encoded = JSON.stringify(message);
    return encoded;
};

/**
 * Unserialize a server message into an object.
 * 
 * @param message Message to unpack.
 */
export const unpackServer = (message: string): ServerMessage => {
    const decoded = JSON.parse(message);
    return decoded;
};
