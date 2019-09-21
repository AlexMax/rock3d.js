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

import { handleMessage } from './handler';
import * as proto from '../proto';
import { fromEntity as cameraFromEntity } from '../r3d/camera';
import { RenderContext } from '../r3d/render';
import { Simulation } from '../sim';

import TESTMAP from '../../asset/TESTMAP.json';

export class Client {
    /**
     * Websocket connection.
     */
    socket: WebSocket;

    /**
     * Time of last message.
     */
    lastTime: number; // Time of last message.

    /**
     * Server messages.
     */
    buffer: proto.ServerMessage[]; // Message backlog.

    /**
     * Clientside (predicted) simulation.
     */
    sim: Simulation;

    /**
     * Entity ID that camera is attached to.
     */
    camEntity: number | null;

    /**
     * Renderer to use for drawing the client.
     */
    renderer: RenderContext;

    constructor(renderer: RenderContext) {
        this.buffer = [];
        this.lastTime = -Infinity;
        this.camEntity = null;
        this.renderer = renderer;

        // Load the level.
        this.sim = new Simulation(TESTMAP, 32);

        // Construct the clientside socket.
        const hostname = window.location.hostname;
        this.socket = new WebSocket('ws://' + hostname + ':11210');

        // All messages get unpacked into our buffer.
        this.socket.addEventListener('message', (evt) => {
            this.lastTime = performance.now();
            const msg = proto.unpackServer(evt.data);
            this.buffer.push(msg);
        });

        // When we connect, greet the server.
        this.socket.addEventListener('open', () => {
            const hello = proto.packClient({
                type: proto.ClientMessageType.Hello,
                name: 'Player'
            });
            this.socket.send(hello);
        });
    }

    read(): proto.ServerMessage | null {
        const msg = this.buffer.shift();
        if (msg === undefined) {
            return null;
        }
        return msg;
    }

    tick() {
        // Service incoming network messages.
        let msg: ReturnType<Client['read']> = null;
        while ((msg = this.read()) !== null) {
            handleMessage(this, msg);
        }

        // Get our latest snapshot data to render.
        const snapshot = this.sim.getSnapshot();

        // We need a camera to actually draw anything.
        if (this.camEntity !== null) {
            const entity = snapshot.entities.get(this.camEntity);
            if (entity !== undefined) {
                const cam = cameraFromEntity(entity);
                const level = this.sim.level;

                // Create our sky.
                this.renderer.world.clearSky();
                this.renderer.world.addSky('SKY1');

                // Add our geometry to be rendered.
                this.renderer.world.clearWorld();
                for (let i = 0;i < level.polygons.length;i++) {
                    this.renderer.world.addPolygon(level.polygons, i);
                }

                // Add our sprites to be rendered.
                this.renderer.world.clearSprites();
                for (let entity of snapshot.entities.values()) {
                    this.renderer.world.addEntity(entity, cam, level.polygons);
                }

                // Render the world.
                this.renderer.world.render(cam);
            }
        }
    }
}
