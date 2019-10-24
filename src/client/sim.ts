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

import * as cmd from '../command';
import { createLevel, Level, SerializedLevel } from '../level';
import { copySnapshot, createSnapshot, Snapshot, tickSnapshot } from '../snapshot';

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
    level: Level;

    /**
     * Last authoritative snapshot from the server.
     */
    authSnapshot: Readonly<Snapshot>;

    /**
     * Current predicted snapshot.
     */
    predictSnapshot: Snapshot;

    /**
     * Last authoritative command set from the server.
     */
    authCommands: Readonly<cmd.Command[]>;

    /**
     * Input buffer for this player.
     */
    inputs: cmd.InputCommand[];

    constructor(level: SerializedLevel, tickrate: number, snapshot: Snapshot) {
        this.period = 1000 / tickrate;
        this.clock = snapshot.clock;
        this.level = createLevel(level);
        this.authSnapshot = snapshot;
        this.predictSnapshot = createSnapshot();
        this.authCommands = [];
        this.inputs = [];
    }

    /**
     * Get the current snapshot.
     */
    getSnapshot(): Readonly<Snapshot> {
        return this.predictSnapshot;
    }

    /**
     * Return the amount of time in the future we're predicting, in ms.
     */
    predictedFrames(): number {
        return this.clock - this.authSnapshot.clock;
    }

    /**
     * Tick one clientside frame, starting from the authoritative snapshot.
     */
    tick(): void {
        // The client's clock always travels forwards.  Only the amount of
        // time that we have to predict changes based on how old our
        // authoritative snapshot is.
        const targetClock = this.clock + 1;

        // Copy our authoritative data into a snapshot we can mutate.
        const current = copySnapshot(createSnapshot(), this.authSnapshot);

        while (current.clock < targetClock) {
            // Find the input for our frame.
            const input = this.inputs.find((ele) => {
                return ele.clock === current.clock;
            }, null);
            if (input === undefined) {
                throw new Error(`Can't find input for frame ${current.clock}.`);
            }

            // Insert our local input into the list of authoritative commands.
            const commands = [...this.authCommands].map((ele) => {
                if (ele.clientID !== input.clientID) {
                    return ele;
                }
                return input;
            });

            // Predict frame.
            tickSnapshot(
                this.predictSnapshot, current, commands, this.level, this.period
            );

            // Copy our prediction into current for the next tic.
            // FIXME: This is not necessary on the last tic.
            copySnapshot(current, this.predictSnapshot);
        }

        // Our clock now officially the target.
        this.clock = targetClock;
    }

    /**
     * Queue a local input command.
     *
     * @param input The input command to queue.
     */
    queueLocalInput(input: cmd.InputCommand): void {
        this.inputs.push(input);
    }

    /**
     * Add authoritative commands to the simulation.
     *
     * @param cmds Commands to update with.
     */
    updateCommands(cmds: Readonly<cmd.Command[]>): void {
        this.authCommands = cmds;
    }

    /**
     * Add authoritative snapshot to the simulation.
     * 
     * @param snap Snapshot to update with.
     */
    updateSnapshot(snap: Readonly<Snapshot>): void {
        if (snap.clock <= this.authSnapshot.clock) {
            return;
        }
        this.authSnapshot = snap;

        // Remove old inputs that we no longer need.
        this.inputs.filter((ele) => {
            return ele.clock >= snap.clock;
        });
    }
}
