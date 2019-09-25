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

import * as cmd from '../command';
import { handleMessage } from './handler';
import * as proto from '../proto';
import { fromEntity as cameraFromEntity, moveRelative } from '../r3d/camera';
import { RenderContext } from '../r3d/render';
import { Simulation } from './sim';
import { Timer } from '../timer';

export class Client {
    /**
     * Client ID.
     */
    id: number | null;

    /**
     * Websocket connection.
     */
    socket: WebSocket;

    /**
     * Server messages.
     */
    buffer: proto.ServerMessage[]; // Message backlog.

    /**
     * Round-trip-time to the server.
     */
    rtt: number | null;

    /**
     * Timer for client tick.
     */
    gameTimer: Timer;

    /**
     * Clientside (predicted) simulation.
     */
    sim: Simulation | null;

    /**
     * Entity that the client is attached to.
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

        this.id = null;
        this.rtt = null;
        this.sim = null;
        this.buffer = [];
        this.camEntity = null;
        this.renderer = renderer;
        this.buttons = 0;
        this.yaw = 0;
        this.pitch = 0;

        // Construct the clientside socket.
        const hostname = window.location.hostname;
        this.socket = new WebSocket('ws://' + hostname + ':11210');

        // All messages get unpacked into our buffer.
        this.socket.addEventListener('message', (evt) => {
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

        // Initialize the timer for the simulation.
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

        if (this.sim === null) {
            // We need to have a simulation to tick.
            console.debug('tick: no simulation');
            return;
        }

        if (this.rtt === null) {
            // We need our ping to know how far ahead we need to be.
            console.debug('tick: no rtt');
            return;
        }

        // How far ahead of the authority should we simulate?
        const predictTicks = Math.ceil((this.rtt / 2) / this.gameTimer.period) + 1;

        this.send({
            type: proto.ClientMessageType.Input,
            clock: this.sim.clock,
            buttons: this.buttons,
            pitch: this.pitch,
            yaw: this.yaw,
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
        if (this.sim === null) {
            // Can't draw if we don't have a simulation.
            console.debug('render: no sim');
            return;
        }

        if (this.camEntity === null) {
            // We need camera to actually draw anything.
            console.debug('render: no camEntity');
            return;
        }

        // Get our latest snapshot data to render.
        const snapshot = this.sim.getSnapshot();

        const entity = snapshot.entities.get(this.camEntity);
        if (entity === undefined) {
            // Entity we're trying to render doesn't exist.
            console.debug('render: missing entity');
            return;
        }


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
        for (let [k, v] of snapshot.entities) {
            if (k === this.camEntity) {
                // Don't draw your own sprite.
                continue;
            }

            this.renderer.world.addEntity(v, cam, level.polygons);
        }

        // Render the world.
        this.renderer.world.render(cam);
    }

    /**
     * Set a specific button to a specific state.
     */
    buttonState(button: cmd.Button, state: boolean) {
        if (state) {
            this.buttons = cmd.setButton(this.buttons, button);
        } else {
            this.buttons = cmd.unsetButton(this.buttons, button);
        }
    }

    /**
     * Move an analog axis, like a mouse or a gamepad.
     */
    axisMove(axis: cmd.Axis, num: number) {
        switch (axis) {
            case cmd.Axis.Pitch:
                this.pitch += num;
                break;
            case cmd.Axis.Yaw:
                this.yaw += num;
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
