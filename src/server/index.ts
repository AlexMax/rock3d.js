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

import { performance } from 'perf_hooks';
import WebSocket, { Server as WSServer } from 'ws';

import { ClientMessage, ServerMessage, unpackClient, packServer } from '../proto';
import { Simulation } from '../sim';
import { Timer } from '../timer';

import TESTMAP from '../../asset/TESTMAP.json';

class Connection {
    id: number; // Connection ID.
    wsc: WebSocket; // Websocket connection.
    init: boolean; // True if connection is ready to participate on server.
    lastTime: number; // Time of last message.
    buffer: ClientMessage[]; // Message backlog.

    constructor(id: number, wsc: WebSocket) {
        this.id = id;
        this.wsc = wsc;
        this.init = false;
        this.lastTime = -Infinity;
        this.buffer = [];

        // All messages get unpacked into our buffer.
        this.wsc.on('message', (data) => {
            this.lastTime = performance.now();
            const msg = unpackClient(data.toString());
            this.buffer.push(msg);
        });
    }

    read(): ClientMessage | null {
        const msg = this.buffer.shift();
        if (msg === undefined) {
            return null;
        }
        return msg;
    }

    send(msg: ServerMessage): void {
        const data = packServer(msg);
        this.wsc.send(data);
    }
}

/**
 * The complete server implementation.
 */
class Server {
    /**
     * Next connection ID.
     */
    nextID: number;

    /**
     * Connections.
     */
    connections: Map<number, Connection>;

    /**
     * Websocket server.
     */
    socket: WSServer;

    /**
     * Timer for game logic.
     */
    gameTimer: Timer;

    /**
     * Serverside game simulation.
     */
    sim: Simulation;

    constructor() {
        this.nextID = 1;
        this.connections = new Map();
        this.socket = new WSServer({
            perMessageDeflate: false,
            port: 11210
        });

        // Websocket connections create a Connection.
        this.socket.on('connection', (wsc) => {
            const id = this.nextID;
            const conn = new Connection(id, wsc);
            wsc.on('close', () => {
                this.connections.delete(id);
            });
            this.connections.set(id, conn);
            this.nextID += 1;
        });

        // Load the level.
        this.sim = new Simulation(TESTMAP, 32);

        // Initialize the timer for the game.
        this.gameTimer = new Timer(() => {
            const start = performance.now();
            this.sim.tick();
            console.log(`frame time: ${performance.now() - start}ms`);
        }, performance.now, 32);
    }

    run() {
        this.gameTimer.start();
    }
}

const server = new Server();
server.run();
