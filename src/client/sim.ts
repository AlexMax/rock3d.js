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
