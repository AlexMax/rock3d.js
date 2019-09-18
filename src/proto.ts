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

/**
 * Possible client messages.
 */
export enum ClientMessageType {
    Hello, // Client just connected, needs full update.
    Command, // Inputs.
}

interface ClientHello {
    type: ClientMessageType.Hello,
    name: string, // Name of the player
}

interface ClientCommand {
    type: ClientMessageType.Command,
    clock: number, // Current client game clock
    button: number, // Currently pressed buttons as a bitfield
    mouse: [number, number], // Current mouse X and Y
}

export type ClientMessage = ClientHello | ClientCommand;

export const packClient = (message: ClientMessage): string => {
    const encoded = JSON.stringify(message);
    return encoded;
}

export const unpackClient = (message: string): ClientMessage => {
    const decoded = JSON.parse(message);
    return decoded;
};

/**
 * Possible server messages.
 */
enum ServerMessageType {
    Update,
}

interface ServerUpdate {
    type: ServerMessageType.Update,
    clock: number, // Current server game clock
}

export type ServerMessage = ServerUpdate;

export const packServer = (message: ServerMessage): string => {
    const encoded = JSON.stringify(message);
    return encoded;
};

export const unpackServer = (message: string): ServerMessage => {
    const decoded = JSON.parse(message);
    return decoded;
};
