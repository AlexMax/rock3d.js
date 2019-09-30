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

import { Client, handleMessage } from './client';
import * as cmd from '../command';
import { Demo, createDemo } from './demo';
import * as proto from '../proto';
import { Simulation } from './sim';
import { Timer } from '../timer';

/**
 * A connection over a websocket.
 */
class SocketConnection {
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

    saveDemoFrame(clock: number, input: cmd.Input): void {
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

export class SocketClient implements Client {
    /**
     * Client ID.
     */
    id: number | null;

    /**
     * Round-trip-time to the server.
     */
    rtt: number | null;

    /**
     * Clientside (predicted) simulation.
     */
    sim: Simulation | null;

    /**
     * Connection abstraction.
     *
     * Either a real connection or a demo player.
     */
    connection: SocketConnection;

    /**
     * Server messages.
     */
    buffer: proto.ServerMessage[]; // Message backlog.

    /**
     * Timer for client tick.
     */
    gameTimer: Timer;

    /**
     * Current input state.
     */
    input: cmd.Input;

    constructor(hostname: string, port: number) {
        this.tick = this.tick.bind(this);

        this.id = null;
        this.rtt = null;
        this.sim = null;

        this.connection = new SocketConnection(hostname, port);
        this.buffer = [];
        this.input = cmd.createInput();

        // Initialize the timer for the simulation.
        const now = performance.now.bind(performance);
        this.gameTimer = new Timer(this.tick, now, 32);
    }

    private tick() {
        if (!this.connection.ready()) {
            // Don't tick with a closed connection.
            return;
        }

        //const start = performance.now();

        // Service incoming network messages.
        let msg: ReturnType<SocketConnection['read']> = null;
        while ((msg = this.connection.read()) !== null) {
            handleMessage(this, msg);
        }

        // We need an id, an rtt, and a sim.
        if (this.id === null || this.rtt === null || this.sim === null) {
            return;
        }

        // Construct an input from our current client state and queue it.
        this.sim.queueLocalInput({
            type: cmd.CommandTypes.Input,
            clientID: this.id,
            clock: this.sim.clock,
            input: this.input,
        });

        // Tick the client simulation a single frame.
        this.sim.tick();

        // How far ahead of the authority are we, actually?
        const actualFrames = this.sim.predictedFrames();

        // How far ahead of the authority should we be?
        const targetFrames = Math.ceil((this.rtt / 2) / this.gameTimer.period) + 1;

        if (actualFrames < targetFrames) {
            // We're too far behind, speed it up.
            this.gameTimer.setScale(0.9);
        } else if (actualFrames > targetFrames) {
            // We're too far ahead, slow it down.
            this.gameTimer.setScale(1.1);
        } else {
            // We're just right.
            this.gameTimer.setScale(1);
        }

        // Send the server our inputs.
        this.connection.send({
            type: proto.ClientMessageType.Input,
            clock: this.sim.clock - 1,
            input: this.input,
        });

        // Save a demo frame.
        this.connection.saveDemoFrame(this.sim.clock - 1, this.input);

        // Pitch and yaw are per-tick accumulators, reset them.
        this.input = cmd.clearAxis(this.input);

        //console.debug(`frame time: ${performance.now() - start}ms`);
    }

    /**
     * Start running the game.
     */
    run() {
        this.gameTimer.start();
    }

    /**
     * Stop the game.
     */
    halt() {
        this.gameTimer.stop();
    }
}
