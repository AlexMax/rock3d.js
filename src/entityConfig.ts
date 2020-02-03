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

import { EntityConfig } from "./entity";

/**
 * Player config.
 */
export const playerConfig: EntityConfig = {
    name: 'Player',
    radius: 16,
    height: 56,
    cameraHeight: 48,
    spritePrefix: 'PLAY',
    grounded: true,
    animations: {
        spawn: [{
            frame: 'A',
        }],
        walk: [{
            frame: 'ABCD',
            time: 125,
        }],
    }
}

/**
 * A static animated burning barrel.
 */
export const burningBarrelConfig: EntityConfig = {
    name: "Burning Barrel",
    radius: 16,
    height: 32,
    spritePrefix: 'FCAN',
    grounded: true,
    animations: {
        spawn: [{
            frame: 'ABC',
            time: 125,
        }]
    }
}

/**
 * A static tall tech pillar.
 */
export const techPillarConfig: EntityConfig = {
    name: "Tech Pillar",
    radius: 16,
    height: 128,
    spritePrefix: 'ELEC',
    grounded: true,
    animations: {
        spawn: [{
            frame: 'A',
        }]
    }
}

const configs = [playerConfig, burningBarrelConfig, techPillarConfig];

/**
 * Get an entity config by name.  Throws if the entity cannot be found.
 * 
 * @param name Name of the entity config.
 */
export const getEntityConfig = (name: string): EntityConfig => {
    for (let i = 0;i < configs.length;i++) {
        if (configs[i].name === name) {
            return configs[i];
        }
    }
    throw new Error(`Cannot find entity config ${name}.`);
};