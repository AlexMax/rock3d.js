/**
 * rock3d.js: A 3D game engine with a retro heart.
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

import { CommandTypes } from '../command';
import { handleMessage } from './handler';
import * as proto from '../proto';
import { Simulation } from './sim';
import { serializeSnapshot } from '../snapshot';
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
     * Starting time of our latest ping attempt.
     */
    pingBegin: number | null;

    /**
     * RTT of last ping/pong.
     */
    rtt: number;

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
        this.pingBegin = null;
        this.rtt = Infinity;
        this.buffer = [];
        this.name = null;
        this.cameraEntity = null;

        // All messages get unpacked into our buffer.
        this.wsc.on('message', (data) => {
            this.lastTime = performance.now();
            const msg = proto.unpackClient(data.toString());
            this.buffer.push(msg);
        });

        // When we get a pong response, tell the client about it.
        this.wsc.on('pong', () => {
            if (this.pingBegin === null) {
                // Got a pong without a ping, ignore it.
                return;
            }
            this.rtt = performance.now() - this.pingBegin;
            this.pingBegin = null;
            this.send({
                type: proto.ServerMessageType.Ping,
                rtt: this.rtt,
            });
        });
    }

    /**
     * Read a message into our connection buffer.
     */
    read(): proto.ClientMessage | null {
        const msg = this.buffer.shift();
        if (msg === undefined) {
            return null;
        }
        return msg;
    }

    /**
     * Send a message to the client.
     * 
     * @param msg Server message to send.
     */
    send(msg: proto.ServerMessage): void {
        const data = proto.packServer(msg);
        this.wsc.send(data);
    }

    /**
     * Ping the client.
     */
    ping(): void {
        if (this.pingBegin !== null) {
            // Don't ping the client while we're still waiting on our last
            // ping response.
            return;
        }

        this.pingBegin = performance.now();
        this.wsc.ping();
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
     * Timer for server.
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
                this.sim.queueCommand({
                    type: CommandTypes.Player,
                    clientID: clientID,
                    action: 'remove',
                });
                this.connections.delete(clientID);

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

        // Do post-tick housekeeping on all players.
        for (let conn of this.connections.values()) {
            // Send latest snapshot to all clients.
            conn.send({
                type: proto.ServerMessageType.Snapshot,
                snapshot: serializeSnapshot(this.sim.getSnapshot()),
                commands: this.sim.getCommands(),
                health: this.sim.getHealth(conn.id),
            });

            // Continue the ping/pong cycle, if able.
            conn.ping();
        }

        //console.debug(`frame time: ${performance.now() - start}ms`);
    }

    /**
     * Start running the game.
     */
    run() {
        this.gameTimer.start();
        console.info({
            msg: 'Server started'
        });
    }
}
