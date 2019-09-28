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

import { Input } from '../command';
import * as proto from '../proto';

export interface DemoTick {
    /**
     * Clock of demo tick.
     */
    clock: number;

    /**
     * Read packet capture for tick.
     */
    readCapture: proto.ServerMessage[];

    /**
     * Input for tick.
     */
    inputCapture: Input;
}

export interface Demo {
    /**
     * Discrete time-slices of demo.
     */
    ticks: DemoTick[];
}

const createDemo = (): Demo => {
    return {
        ticks: [],
    };
};

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
     * Save a demo frame.
     */
    saveDemoFrame: (clock: number, input: Input) => void;

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
     * Buffered server messages.
     */
    buffer: proto.ServerMessage[];

    /**
     * Buffered messages for demo.
     */
    demoBuffer: proto.ServerMessage[];

    /**
     * Saved demo for connection.
     */
    demo: Demo;

    constructor(hostname: string, port: number) {
        this.buffer = [];
        this.demoBuffer = [];
        this.demo = createDemo();
        this.wsc = new WebSocket('ws://' + hostname + ':' + port.toString());

        // All messages get unpacked into our buffer.
        this.wsc.addEventListener('message', (evt) => {
            const msg = proto.unpackServer(evt.data);
            this.buffer.push(msg);
            this.demoBuffer.push(msg);
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

    saveDemoFrame(clock: number, input: Input): void {
        this.demo.ticks.push({
            clock: clock,
            readCapture: this.demoBuffer,
            inputCapture: input,
        });
        this.demoBuffer = [];
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
     * Demo we're using as our "connection".
     */
    demo: Demo;

    /**
     * Position inside the packet capture.
     */
    pos: number;

    /**
     * Buffer of unread messages for given position.
     */
    buffer: proto.ServerMessage[];

    constructor(data: string) {
        this.demo = JSON.parse(data);
        this.pos = 0;
        this.buffer = [];
        this.hydrate();
    }

    ready(): boolean {
        return true;
    }

    read(): proto.ServerMessage | null {
        const msg = this.buffer.shift();
        if (msg === undefined) {
            return null;
        }
        return msg;
    }

    saveDemoFrame(clock: number, input: Input): void {
        // Do nothing.
    }

    send(msg: proto.ClientMessage): void {
       // Do nothing.
    }

    private hydrate() {
        const tick = this.demo.ticks[this.pos];
        if (tick === undefined) {
            return;
        }
        this.buffer = [...tick.readCapture];
    }

    getTick() {
        return this.demo.ticks[this.pos];
    }
}
