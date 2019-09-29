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
import { Client, handleMessage } from './client';
import * as proto from '../proto';
import { Simulation } from './sim';

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
     * Client ID.
     */
    id: number | null;

    /**
     * Round-trip-time to the server.
     */
    rtt: number | null;

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

    constructor(data: string) {
        this.id = null;
        this.rtt = null;
        this.sim = null;

        this.demo = JSON.parse(data);
        this.pos = 0;
    }

    private tick() {
        if (this.pos + 1 >= this.demo.ticks.length) {
            return;
        }

        const tick = this.demo.ticks[this.pos];

        // Service network messages for demo tick.
        for (let msg of tick.readCapture) {
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

    getTick() {
        return this.demo.ticks[this.pos];
    }

    first() {
        this.id = null;
        this.rtt = null;
        this.sim = null;

        this.pos = 0;
    }

    next() {
        this.tick();
    }
}
