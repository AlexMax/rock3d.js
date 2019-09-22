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

/**
 * This contains the complete wire protocol of both the client and the server.
 * It also doubles as a sort of expected protocol of the schema.
 */

import { SerializedSnapshot } from './sim';

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
    Command,
}

export interface ClientHello {
    type: ClientMessageType.Hello,

    /**
     * Name of the player.
     */
    name: string,
}

export interface ClientCommand {
    type: ClientMessageType.Command,

    /**
     * Clientside game clock of the command.
     */
    clock: number,

    /**
     * Currently pressed buttons as a bitfield.
     */
    buttons: number,

    /**
     * Current pitch axis.
     */
    pitch: number,

    /**
     * Current yaw axis.
     */
    yaw: number,
}

export type ClientMessage = ClientHello | ClientCommand;

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
     * Tell the client how far away they are from the server.
     */
    Ping,

    /**
     * Game data sent from the server.
     */
    Snapshot,

    /**
     * Tell the client which entity their camera should be attached to.
     */
    Camera,
}

export interface ServerPing {
    type: ServerMessageType.Ping,

    /**
     * Round-trip-time, in milliseconds.
     */
    rtt: number,
}

export interface ServerSnapshot {
    type: ServerMessageType.Snapshot,

    /**
     * Snapshot data.
     */
    snapshot: SerializedSnapshot,
}

export interface ServerCamera {
    type: ServerMessageType.Camera,

    /**
     * Entity ID.
     */
    id: number | null,
}

export type ServerMessage = ServerPing | ServerSnapshot | ServerCamera;

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
