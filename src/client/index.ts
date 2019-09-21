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

import {
    packClient, ClientMessageType, unpackServer, ServerMessage
} from '../proto';
import { Simulation } from '../sim';
import { RenderContext } from '../r3d/render';
import { Camera, create as createCamera } from '../r3d/camera';

import TESTMAP from '../../asset/TESTMAP.json';

class Client {

    sim: Simulation; // Clientside (predicted) simulation.
    socket: WebSocket; // Websocket connection.
    lastTime: number; // Time of last message.
    buffer: ServerMessage[]; // Message backlog.

    constructor() {
        this.buffer = [];
        this.lastTime = -Infinity;

        // Load the level.
        this.sim = new Simulation(TESTMAP, 32);

        // Construct the clientside socket.
        const hostname = window.location.hostname;
        this.socket = new WebSocket('ws://' + hostname + ':11210');

        // All messages get unpacked into our buffer.
        this.socket.addEventListener('message', (evt) => {
            this.lastTime = performance.now();
            const msg = unpackServer(evt.data);
            this.buffer.push(msg);
        });

        // When we connect, greet the server.
        this.socket.addEventListener('open', () => {
            const hello = packClient({
                type: ClientMessageType.Hello,
                name: 'Player'
            });
            this.socket.send(hello);
        });
    }

    read(): ServerMessage | null {
        const msg = this.buffer.shift();
        if (msg === undefined) {
            return null;
        }
        return msg;
    }
}

window.addEventListener("load", async () => {
    // Get our client element.
    const root = document.getElementById('client');
    if (root === null) {
        throw new Error('Could not find root element');
    }

    // Create a 3D renderer inside the element.
    const canvas = document.createElement('canvas');
    const renderer = new RenderContext(canvas);
    const cam: Camera | null = null;
    root.appendChild(canvas);

    // Create our connection.
    const client = new Client();

    const draw = () => {
        const msg = client.read();
        if (msg !== null) {
            console.log(msg);
        }

        const snapshot = client.sim.getSnapshot();

        // We need a camera to actually draw anything.
        if (cam !== null) {
            // Clear before we draw.
            renderer.world.clearWorld();

            // Add our geometry to be rendered.
            const level = client.sim.level;
            for (let i = 0;i < level.polygons.length;i++) {
                renderer.world.addPolygon(level.polygons, i);
            }

            // Render the world.
            renderer.world.render(cam);
        }

        window.requestAnimationFrame(draw);
    }
    window.requestAnimationFrame(draw);
});

