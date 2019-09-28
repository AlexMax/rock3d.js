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
import { Connection, Demo } from './connection';
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
     * Connection abstraction.
     *
     * Either a real connection or a demo player.
     */
    connection: Connection;

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
     * Renderer to use for drawing the client.
     */
    renderer: RenderContext;

    /**
     * Current input state.
     */
    input: cmd.Input;

    constructor(conn: Connection, renderer: RenderContext) {
        this.tick = this.tick.bind(this);

        this.id = null;
        this.connection = conn;
        this.rtt = null;
        this.sim = null;
        this.buffer = [];
        this.renderer = renderer;
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
        let msg: ReturnType<Connection['read']> = null;
        while ((msg = this.connection.read()) !== null) {
            handleMessage(this, msg);
        }

        if (this.id === null) {
            // We need to be aware of our own ID to tick.
            return;
        }

        if (this.sim === null) {
            // We need to have a simulation to tick.
            return;
        }

        if (this.rtt === null) {
            // We need our ping to know how far ahead we need to be.
            return;
        }

        // Construct an input from our current client state and queue it.
        const inputCmd: cmd.InputCommand = {
            type: cmd.CommandTypes.Input,
            clientID: this.id,
            clock: this.sim.clock,
            input: this.input,
        };
        this.sim.queueLocalInput(inputCmd);

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
     * Render the most up-to-date snapshot of the game.
     * 
     * This is _not_ handled inside the main game loop, it should usually
     * be called from an endless loop of requestAnimationFrame.
     */
    render() {
        if (this.id === null) {
            // We're not even connected yet...
            console.debug('no client id');
            return;
        }

        if (this.sim === null) {
            // Can't draw if we don't have a simulation.
            console.debug('no sim');
            return;
        }

        // Get our latest snapshot data to render.
        const snapshot = this.sim.getSnapshot();

        const camEntity = snapshot.players.get(this.id);
        if (camEntity === undefined) {
            // Player has no camera entity.
            console.debug('no entity id');
            return;
        }

        const entity = snapshot.entities.get(camEntity);
        if (entity === undefined) {
            // Entity we're trying to render doesn't exist.
            console.debug('entity doesnt exist');
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
            if (k === camEntity) {
                // Don't draw your own sprite.
                continue;
            }

            this.renderer.world.addEntity(v, cam, level.polygons);
        }

        // Render the world.
        this.renderer.world.render(cam);
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

    /**
     * Run a tick outside the timer with the given inputs.
     */
    manualTick(input: cmd.Input) {
        this.input = input;
        this.tick();
    }
}
