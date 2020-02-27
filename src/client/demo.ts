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

import { Assets } from './asset';
import * as cmd from '../command';
import { Client, handleMessage } from './client';
import * as proto from '../proto';
import { Simulation } from './sim';
import { Timer } from '../timer';

export interface DemoTick {
    /**
     * Clock of demo tick.
     */
    clock: number;

    /**
     * Read packet capture for tick.
     */
    readCapture: proto.ServerMessage[];

    /**
     * Input for tick.
     */
    inputCapture: cmd.Input;
}

export interface Demo {
    /**
     * Discrete time-slices of demo.
     */
    ticks: DemoTick[];
}

export const createDemo = (): Demo => {
    return {
        ticks: [],
    };
};

export class DemoClient implements Client {
    /**
     * Assets accessible to client.
     */
    readonly assets: Assets;

    /**
     * Client ID.
     */
    id: number | null;

    /**
     * Round-trip-time to the server.
     */
    rtt: number | null;

    /**
     * Health of connection.
     */
    health: number | null;

    /**
     * Clientside (predicted) simulation.
     */
    sim: Simulation | null;

    /**
     * Demo that we're looking at.
     */
    demo: Demo;

    /**
     * Position in demo.
     */
    pos: number;

    /**
     * Timer for demo tick.
     */
    demoTimer: Timer;

    constructor(assets: Assets, data: string) {
        this.tick = this.tick.bind(this);

        this.assets = assets;
        this.id = null;
        this.rtt = null;
        this.health = null;
        this.sim = null;

        this.demo = JSON.parse(data);
        this.pos = 0;

        // Initialize the timer for the demo.
        const now = performance.now.bind(performance);
        this.demoTimer = new Timer(this.tick, now, 32);
    }

    private tick(): void {
        if (this.pos + 1 >= this.demo.ticks.length) {
            return;
        }

        const tick = this.demo.ticks[this.pos];

        // Service network messages for demo tick.
        for (const msg of tick.readCapture) {
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
            input: tick.inputCapture,
        });

        // Tick the client simulation a single frame.
        this.sim.tick();
        this.pos += 1;
    }

    /**
     * Rewind back to the first tick.
     */
    first(): void {
        this.id = null;
        this.rtt = null;
        this.sim = null;

        this.pos = 0;
    }

    /**
     * Rewind to the last tick.
     */
    previous(): void {
        const target = Math.max(0, this.pos - 1);
        this.first();
        while (this.pos < target) {
            this.tick();
        }
    }

    /**
     * Get current tick information.
     */
    getTick(): DemoTick {
        return this.demo.ticks[this.pos];
    }

    /**
     * Go to the next tick.
     */
    next(): void {
        this.tick();
    }

    /**
     * Pause the demo.
     */
    pause(): void {
        this.demoTimer.stop();
    }

    /**
     * Run the demo in normal time.
     */
    play(): void {
        this.demoTimer.start();
    }

    /**
     * Go to the end of the demo.
     */
    end(): void {
        const target = this.demo.ticks.length - 1;
        while (this.pos < target) {
            this.tick();
        }
    }
}
