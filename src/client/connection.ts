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

import * as proto from '../proto';

interface Capture {
    /**
     * Timestamp of message.
     */
    time: number;

    /**
     * Actual server message.
     */
    msg: proto.ServerMessage;
}

export interface Connection {
    /**
     * Returns true if the connection is ready, otherwise false.
     */
    ready: () => boolean;

    /**
     * Read a message from the connection.
     */
    read: () => proto.ServerMessage | null;

    /**
     * Send a message through the connection.
     */
    send: (msg: proto.ClientMessage) => void;
}

/**
 * A connection over a websocket.
 */
export class SocketConnection implements Connection {
    /**
     * Websocket connection.
     */
    wsc: WebSocket;

    /**
     * Server messages.
     */
    buffer: proto.ServerMessage[];

    constructor(hostname: string, port: number) {
        this.buffer = [];
        this.wsc = new WebSocket('ws://' + hostname + ':' + port.toString());

        // All messages get unpacked into our buffer.
        this.wsc.addEventListener('message', (evt) => {
            const msg = proto.unpackServer(evt.data);
            this.buffer.push(msg);
        });

        // When we connect, greet the server.
        this.wsc.addEventListener('open', () => {
            const hello = proto.packClient({
                type: proto.ClientMessageType.Hello,
                name: 'Player'
            });
            this.wsc.send(hello);
        });
    }

    ready(): boolean {
        return this.wsc.readyState === WebSocket.OPEN;
    }

    read(): proto.ServerMessage | null {
        const msg = this.buffer.shift();
        if (msg === undefined) {
            return null;
        }
        return msg;
    }

    send(msg: proto.ClientMessage): void {
        const data = proto.packClient(msg);
        this.wsc.send(data);
    }
}

/**
 * A dummy connection used for demo playback.
 */
export class DemoConnection implements Connection {

    /**
     * Complete packet capture.
     */
    capture: Capture[];

    /**
     * Position inside the packet capture.
     */
    pos: number;

    constructor(data: string) {
        this.capture = JSON.parse(data);
        this.pos = 0;
    }

    ready(): boolean {
        return true;
    }

    read(): proto.ServerMessage | null {
        const packet = this.capture[this.pos];
        if (packet === undefined) {
            return null;
        }
        this.pos += 1;
        return packet.msg;
    }

    send(msg: proto.ClientMessage): void {
       // Do nothing.
    }
}
