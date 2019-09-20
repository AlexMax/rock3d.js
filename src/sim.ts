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

import { quat, vec3 } from 'gl-matrix';

import { Entity, playerConfig } from './entity';
import { Level } from './level';
import { LevelData } from './leveldata';

const SNAPSHOT_MAX = 8;

interface Snapshot {
    entities: Map<number, Entity>;
}

/**
 * Set the contents of destination snapshot to source.
 */
const snapCopy = (dst: Snapshot, src: Snapshot) => {
    // Shallow copy our entities Map.
    dst.entities.clear();
    for (let [k, v] of src.entities) {
        dst.entities.set(k, v);
    }
}

export class Simulation {

    period: number;
    currentTick: number;
    readonly level: Level;
    snapshots: Snapshot[];
    player: number | null;

    constructor(data: LevelData, tickrate: number) {
        this.period = 1000 / tickrate;
        this.currentTick = 0;
        this.level = new Level(data);
        this.snapshots = [];
        for (let i = 0;i < SNAPSHOT_MAX;i++) {
            this.snapshots.push({
                entities: new Map()
            });
        }
        this.player = null;
    }

    tick() {
        const currentIndex = this.currentTick % SNAPSHOT_MAX;
        const current: Readonly<Snapshot> = this.snapshots[currentIndex];
        const target = this.snapshots[(currentIndex + 1) % SNAPSHOT_MAX];

        // Copy our current snapshot into our target snapshot.
        snapCopy(target, current);

        // Spawn a player if he doesn't exist.
        if (this.player === null) {
            target.entities.set(1, {
                config: playerConfig,
                polygon: 0,
                position: vec3.fromValues(0, 0, 0),
                rotation: quat.fromEuler(quat.create(), 0, 0, 90),
            });
            this.player = 1;
        }
    }
}
