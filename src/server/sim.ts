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
import { createSnapshot, Snapshot, tickSnapshot } from '../snapshot';
import { createLevel, Level, SerializedLevel } from '../level';

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
    commands: cmd.Command[][];

    /**
     * Command queue for internal commands to be resolved before inputs.
     */
    preInputs: cmd.Command[];

    /**
     * Future input buffer for each player.
     */
    inputs: Map<number, cmd.InputCommand[]>;

    /**
     * Input buffer health for each player.
     */
    health: Map<number, number | null>;

    constructor(level: SerializedLevel, tickrate: number) {
        this.period = 1000 / tickrate;
        this.clock = 0;
        this.level = createLevel(level);
        this.snapshots = [];
        this.commands = [];
        for (let i = 0;i < SNAPSHOT_MAX;i++) {
            this.snapshots[i] = createSnapshot();
            this.commands[i] = [];
        }
        this.preInputs = [];
        this.inputs = new Map();
        this.health = new Map();
    }

    tick() {
        const current: Readonly<Snapshot> = this.snapshots[this.clock % SNAPSHOT_MAX];
        const target = this.snapshots[(this.clock + 1) % SNAPSHOT_MAX]

        // Collect input commands for every player.
        const preInputCommands = [...this.preInputs];
        const inputCommands: cmd.InputCommand[] = [];
        for (const [clientID, inputs] of this.inputs) {
            let ahead: number | null = null;
            const best = inputs.reduce((acc: cmd.InputCommand | null, cur) => {
                if (cur.clock > this.clock) {
                    // Count how far ahead this tick was, for later.
                    const diff = cur.clock - this.clock;
                    if (ahead === null || diff > ahead) {
                        ahead = diff;
                    }

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
            if (best === null) {
                preInputCommands.push({
                    type: cmd.CommandTypes.Player,
                    clientID: clientID,
                    action: 'remove',
                });
                continue;
            }

            // Add this input.
            inputCommands.push(best);

            // Record how far ahead or behind the player is.
            if (ahead !== null) {
                // Client is ahead, should probably slow down.
                this.health.set(clientID, ahead);
            } else if (best.clock < this.clock) {
                // Client is behind, should probably speed up.
                this.health.set(clientID, best.clock - this.clock);
            } else {
                // Client is just right.
                this.health.set(clientID, 0);
            }

            // Filter out inputs that are too old to be useful.
            this.inputs.set(clientID, inputs.filter((input) => {
                return input.clock > this.clock - SNAPSHOT_MAX;
            }));
        }

        // Tick our snapshot.
        const commands = this.preInputs.concat(inputCommands);
        tickSnapshot(target, current, commands, this.level, this.period);
        this.clock += 1;

        // Save our commands so we can deliver them to clients later.
        this.commands[this.clock % SNAPSHOT_MAX] = commands;

        // Clear any queued commands.
        this.preInputs = [];
    }

    /**
     * Depending on what command to queue, do something different.
     * 
     * @param command 
     */
    queueCommand(command: cmd.Command) {
        switch (command.type) {
            case cmd.CommandTypes.Input:
                var inputs = this.inputs.get(command.clientID);
                if (inputs === undefined) {
                    // Got inputs for a client that we don't know about.
                    return;
                }

                // Add inputs to the appropriate input buffer.
                inputs.push(command);
                break;
            case cmd.CommandTypes.Player:
                // Add or remove players from the simulation.
                var inputs = this.inputs.get(command.clientID);
                if (command.action === 'add' && inputs === undefined) {
                    this.inputs.set(command.clientID, []);
                    this.health.set(command.clientID, null);
                } else if (command.action === 'remove' && inputs !== undefined) {
                    this.inputs.delete(command.clientID);
                    this.health.delete(command.clientID);
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
    getCommands(): Readonly<cmd.Command[]> {
        return this.commands[this.clock % SNAPSHOT_MAX];
    }

    /**
     * Get the average health of the client ID.
     * 
     * @param clientID Client ID to get health for.
     */
    getHealth(clientID: number) {
        const health = this.health.get(clientID);
        if (health === undefined) {
            return null;
        }
        return health;
    }
}
