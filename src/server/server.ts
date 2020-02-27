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

import { readFileSync } from 'fs';

import { performance } from 'perf_hooks';
import WebSocket, { Server as WSServer } from 'ws';

import { CommandTypes } from '../command';
import { handleMessage } from './handler';
import { assertSerializedLevel } from '../level';
import * as proto from '../proto';
import { Simulation } from './sim';
import { serializeSnapshot } from '../snapshot';
import { Timer } from '../timer';

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
        const mapJSON = readFileSync('asset/map/TESTMAP.json', {
            encoding: "utf8"
        });
        const map = JSON.parse(mapJSON);
        assertSerializedLevel(map);
        this.sim = new Simulation(map, 32);

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
