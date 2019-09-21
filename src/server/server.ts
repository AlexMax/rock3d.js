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

import { handleMessage } from './handler';
import * as proto from '../proto';
import { serializeSnapshot, Simulation } from '../sim';
import { Timer } from '../timer';

import TESTMAP from '../../asset/TESTMAP.json';

class Connection {
    /**
     * Connection ID.
     */
    id: number;

    /**
     * Websocket connection.
     */
    wsc: WebSocket;

    /**
     * True if the connection is ready to participate on the server.
     */
    init: boolean;

    /**
     * Time of last message.
     */
    lastTime: number;

    /**
     * Client messages.
     */
    buffer: proto.ClientMessage[];

    /**
     * Name of the client.
     */
    name: string | null;

    /**
     * Entity whose eyes this player should be looking through.
     */
    cameraEntity: number | null;

    constructor(id: number, wsc: WebSocket) {
        this.id = id;
        this.wsc = wsc;
        this.init = false;
        this.lastTime = -Infinity;
        this.buffer = [];
        this.name = null;
        this.cameraEntity = null;

        // All messages get unpacked into our buffer.
        this.wsc.on('message', (data) => {
            this.lastTime = performance.now();
            const msg = proto.unpackClient(data.toString());
            this.buffer.push(msg);
        });
    }

    read(): proto.ClientMessage | null {
        const msg = this.buffer.shift();
        if (msg === undefined) {
            return null;
        }
        return msg;
    }

    send(msg: proto.ServerMessage): void {
        const data = proto.packServer(msg);
        this.wsc.send(data);
    }
}

/**
 * The complete server implementation.
 */
export class Server {
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
        this.tick = this.tick.bind(this);
        this.nextID = 1;
        this.connections = new Map();
        this.socket = new WSServer({
            perMessageDeflate: false,
            port: 11210
        });

        // Websocket connections create a Connection.
        this.socket.on('connection', (wsc, req) => {
            const clientID = this.nextID;
            const conn = new Connection(clientID, wsc);
            wsc.on('close', () => {
                this.connections.delete(clientID);
                this.sim.removePlayer(clientID);

                console.info({
                    msg: 'Disconnected',
                    client: clientID,
                });
            });
            this.connections.set(clientID, conn);
            this.nextID += 1;

            console.info({
                msg: 'Connected',
                client: clientID,
                address: req.socket.remoteAddress,
                port: req.socket.remotePort,
            });
        });

        // Load the level.
        this.sim = new Simulation(TESTMAP, 32);

        // Initialize the timer for the game.
        this.gameTimer = new Timer(this.tick, performance.now, 32);
    }

    private tick() {
        //const start = performance.now();

        // Service incoming network messages.
        for (let [k, v] of this.connections) {
            let msg: ReturnType<Connection['read']> = null;
            while ((msg = v.read()) !== null) {
                handleMessage(this, k, msg);
            }
        }

        // Do one gametic's worth of simulation.
        this.sim.tick();

        // Send latest snapshot to all clients.
        this.sendAll({
            type: proto.ServerMessageType.Snapshot,
            clock: this.sim.clock,
            snapshot: serializeSnapshot(this.sim.getSnapshot()),
        });

        // Update players about any camera changes.
        for (let [k, v] of this.connections) {
            const entityID = this.sim.getPlayerEntity(k);
            if (entityID !== v.cameraEntity) {
                v.send({
                    type: proto.ServerMessageType.Camera,
                    id: entityID,
                });
                (this.connections.get(k) as Connection).cameraEntity = entityID;
            }
        }

        //console.debug(`frame time: ${performance.now() - start}ms`);
    }

    /**
     * Send a message to all connected clients.
     */
    private sendAll(msg: proto.ServerMessage) {
        for (let conn of this.connections.values()) {
            conn.send(msg);
        }
    }

    /**
     * Start running the game.
     */
    run() {
        this.gameTimer.start();
    }
}
