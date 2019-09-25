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

import { Level } from '../level';
import { LevelData } from '../leveldata';
import { Snapshot } from '../snapshot';

/**
 * Clientside simulation.
 */
export class Simulation {

    /**
     * Period of one tick in milliseconds.
     */
    period: number;

    /**
     * Current clientside clock.
     */
    clock: number;

    /**
     * Original level data.
     */
    readonly level: Level;

    /**
     * Last authoritative snapshot from the server.
     */
    authSnapshot: Snapshot;

    constructor(data: LevelData, tickrate: number, snapshot: Snapshot) {
        this.period = 1000 / tickrate;
        this.clock = snapshot.clock;
        this.level = new Level(data);
        this.authSnapshot = snapshot;
    }

    /**
     * Get the current snapshot.
     */
    getSnapshot(): Readonly<Snapshot> {
        return this.authSnapshot;
    }

    /**
     * Add authoritative snapshot to the simulation.
     * 
     * @param snap Snapshot to update with.
     */
    updateSnapshot(snap: Readonly<Snapshot>) {
        if (snap.clock <= this.authSnapshot.clock) {
            return;
        }
        this.authSnapshot = snap;
    }
}
