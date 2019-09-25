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

import * as com from '../command';
import { createSnapshot, Snapshot, tickSnapshot } from '../snapshot';
import { Level } from '../level';
import { LevelData } from '../leveldata';

const SNAPSHOT_MAX = 32;

/**
 * Serverside simulation.
 */
export class Simulation {

    /**
     * Period of one tick in milliseconds.
     */
    period: number;

    /**
     * Current serverside clock.
     */
    clock: number;

    /**
     * Original level data.
     */
    readonly level: Level;

    /**
     * Past snapshots for the server.
     */
    snapshots: Snapshot[];

    /**
     * Past complete set of commands.
     */
    commands: com.Command[][];

    /**
     * Command queue for internal commands to be resolved before inputs.
     */
    preInputs: com.Command[];

    /**
     * Future command buffer for each player.
     */
    inputs: Map<number, com.InputCommand[]>;

    constructor(data: LevelData, tickrate: number) {
        this.period = 1000 / tickrate;
        this.clock = 0;
        this.level = new Level(data);
        this.snapshots = [];
        this.commands = [];
        for (let i = 0;i < SNAPSHOT_MAX;i++) {
            this.snapshots[i] = createSnapshot();
            this.commands[i] = [];
        }
        this.preInputs = [];
        this.inputs = new Map();
    }

    tick() {
        const current: Readonly<Snapshot> = this.snapshots[this.clock % SNAPSHOT_MAX];
        const target = this.snapshots[(this.clock + 1) % SNAPSHOT_MAX]

        // Collect input commands for every player.
        const preInputCommands = [...this.preInputs];
        const inputCommands: com.InputCommand[] = [];
        for (const [clientID, inputs] of this.inputs) {
            const latest = inputs.reduce((acc: com.InputCommand | null, cur) => {
                if (cur.clock > this.clock) {
                    // Ignore this input, it's too far ahead.
                    return acc;
                }
                if (acc === null) {
                    // Accumulator is null, current always wins.
                    return cur;
                }
                if (cur.clock > acc.clock) {
                    // Current is newer than accumulator.
                    return cur;
                }
                // Keep our current accumulator.
                return acc;
            }, null);

            // We don't have any inputs for this player, get them up out
            // the paint.
            if (latest === null) {
                preInputCommands.push({
                    type: com.CommandTypes.Player,
                    clientID: clientID,
                    action: 'remove',
                });
            }
        }

        // Tick our snapshot.
        const commands = this.preInputs.concat(inputCommands);
        tickSnapshot(target, current, commands);
        this.clock += 1;

        // Save our commands so we can deliver them to clients later.
        this.commands[this.clock % SNAPSHOT_MAX] = commands;
    }

    /**
     * Depending on what command to queue, do something different.
     * 
     * @param command 
     */
    queueCommand(command: com.Command) {
        switch (command.type) {
            case com.CommandTypes.Input:
                var inputs = this.inputs.get(command.clientID);
                if (inputs === undefined) {
                    // Got inputs for a client that we don't know about.
                    return;
                }

                // Add inputs to the appropriate input buffer.
                inputs.push(command);
                break;
            case com.CommandTypes.Player:
                // Add or remove players from the simulation.
                var inputs = this.inputs.get(command.clientID);
                if (command.action === 'add' && inputs === undefined) {
                    this.inputs.set(command.clientID, []);
                } else if (command.action === 'remove' && inputs !== undefined) {
                    this.inputs.delete(command.clientID);
                }

                // Player creation and destruction is handled before inputs.
                this.preInputs.push(command);
                break;
        }
    }

    /**
     * Return a serialized snapshot of state.
     */
    getSnapshot(): Readonly<Snapshot> {
        return this.snapshots[this.clock % SNAPSHOT_MAX];
    }

    /**
     * Return the latest set of commands from the last tick.
     */
    getCommands(): Readonly<com.Command[]> {
        return this.commands[this.clock % SNAPSHOT_MAX];
    }
}
