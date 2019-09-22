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

import { Axis, Button, setButton, unsetButton } from '../command';
import { handleMessage } from './handler';
import * as proto from '../proto';
import { fromEntity as cameraFromEntity, moveRelative } from '../r3d/camera';
import { RenderContext } from '../r3d/render';
import { Simulation } from '../sim';
import { Timer } from '../timer';

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
     * Timer for game logic.
     */
    gameTimer: Timer;

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

    /**
     * Current button state.
     */
    buttons: number;

    /**
     * Amount of yaw accumulated since last tick.
     */
    yaw: number;

    /**
     * Amount of pitch accumulated since last tick.
     */
    pitch: number;

    constructor(renderer: RenderContext) {
        this.tick = this.tick.bind(this);
        this.buffer = [];
        this.lastTime = -Infinity;
        this.camEntity = null;
        this.renderer = renderer;
        this.buttons = 0;
        this.yaw = 0;
        this.pitch = 0;

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

        // Initialize the timer for the game.
        const now = performance.now.bind(performance);
        this.gameTimer = new Timer(this.tick, now, 32);
    }

    private read(): proto.ServerMessage | null {
        const msg = this.buffer.shift();
        if (msg === undefined) {
            return null;
        }
        return msg;
    }

    private send(msg: proto.ClientMessage): void {
        const data = proto.packClient(msg);
        this.socket.send(data);
    }

    private tick() {
        if (this.socket.readyState !== WebSocket.OPEN) {
            // Don't tick with a closed connection.
            return;
        }

        //const start = performance.now();

        // Service incoming network messages.
        let msg: ReturnType<Client['read']> = null;
        while ((msg = this.read()) !== null) {
            handleMessage(this, msg);
        }

        // Construct command from current button and axis state.
        this.send({
            type: proto.ClientMessageType.Command,
            clock: this.sim.clock, buttons: this.buttons,
            yaw: this.yaw, pitch: this.pitch,
        });

        // Yaw and Pitch are per-tick accumulators, reset them.
        this.yaw = 0;
        this.pitch = 0;

        //console.debug(`frame time: ${performance.now() - start}ms`);
    }

    /**
     * Render the most up-to-date snapshot of the game.
     * 
     * This is _not_ handled inside the main game loop, it should usually
     * be called from an endless loop of requestAnimationFrame.
     */
    render() {
        // Get our latest snapshot data to render.
        const snapshot = this.sim.getSnapshot();

        // We need a camera to actually draw anything.
        if (this.camEntity !== null) {
            const entity = snapshot.entities.get(this.camEntity);
            if (entity !== undefined) {
                const cam = moveRelative(cameraFromEntity(entity),
                    0, 0, entity.config.cameraZ);
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

    /**
     * Set a specific button to a specific state.
     */
    buttonState(button: Button, state: boolean) {
        if (state) {
            this.buttons = setButton(this.buttons, button);
        } else {
            this.buttons = unsetButton(this.buttons, button);
        }
    }

    /**
     * Move an analog axis, like a mouse or a gamepad.
     */
    axisMove(axis: Axis, num: number) {
        switch (axis) {
            case Axis.Yaw:
                this.yaw += num;
                break;
            case Axis.Pitch:
                this.pitch += num;
                break;
        }
    }

    /**
     * Start running the game.
     */
    run() {
        this.gameTimer.start();
    }
}
