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

import { vec3 } from "gl-matrix";

import { generateIsEnum } from "./util";

/**
 * Possible states.
 */
export enum States {
    spawn = "spawn",
    walk = "walk",
}

/**
 * Type guard for States.
 */
export const isValidState = generateIsEnum(States);

 /**
 * A single frame of animation.
 */
interface Frame {
    /**
     * Name of the frame, added to the prefix.
     */
    frame: string;

    /**
     * Amount of time, in ms, to spend on the frame.  If not supplied, frame
     * lasts forever.
     */
    time?: number;
}

/**
 * Info for a given animation.
 */
interface Animation {
    /**
     * True if animation should loop forever.
     */
    loop?: true;

    /**
     * Frames of animation.
     */
    frames: Frame[];
}

/**
 * Possible animation states and their associated frame data.
 */
interface Animations {
    /**
     * Entity spawned.
     */
    spawn?: Animation;

    /**
     * Player/Monster is walking.
     */
    walk?: Animation;
}

/**
 * Internal entity type definition.
 */
export interface EntityConfig {
    /**
     * Name of the entity, for informational or debugging purposes.
     */
    name: string;

    /**
     * Radius of the entity.
     */
    radius: number;

    /**
     * Height of the entity.
     */
    height: number;

    /**
     * How high off the ground the camera is.
     */
    cameraHeight?: number;

    /**
     * Prefix string that all animations for this entity share.
     */
    spritePrefix: string;

    /**
     * True if this entity should be billboarded relative to the floor,
     * otherwise false if the entity should be billboarded on all axis.
     */
    grounded: boolean;

    /**
     * Animation states and frames.
     */
    animations: Animations;
}

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
        spawn: {
            frames: [{
                frame: 'A',
            }],
        },
        walk: {
            loop: true,
            frames: [{
                frame: 'ABCD',
                time: 125,
            }]
        },
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
        spawn: {
            loop: true,
            frames: [{
                frame: 'ABC',
                time: 125,
            }]
        }
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
        spawn: {
            frames: [{
                frame: 'A'
            }]
        }
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

/**
 * Get the current animation frame of an animation.
 * 
 * @param config Entity config to look inside.
 * @param state State to look through.
 * @param baseClock Base clock of the animation.
 * @param clock Current global clock.
 * @param period Period to use.
 */
export const getAnimationFrame = (
    config: EntityConfig, state: States, baseClock: number,
    clock: number, period: number
): string => {
    const animations = config.animations[state];
    if (animations === undefined) {
        throw new Error(`Invalid state ${state} in ${config.name}`);
    }

    // First find the total length of the animation.
    const len = animations.frames.reduce((prev, cur) => {
        if (cur.time) {
            return prev + (cur.time * cur.frame.length);
        } else {
            return prev;
        }
    }, 0);

    // Figure out what time in the animation we should be inside.
    let time = (clock - baseClock) * period;
    if (animations.loop === true) {
        time %= len;
    } else {
        time = Math.min(time, len);
    }

    // Now determine which frame we should return.
    let frame = 'A';
    let passed = 0;
    for (let i = 0;i < animations.frames.length;i++) {
        const frames = animations.frames[i];
        for (let j = 0;j < frames.frame.length;j++) {
            if (passed > time) {
                // We have overshot our frame, return the last frame.
                return frame;
            }
            frame = frames.frame[j];
            if (!(typeof frames.time === 'number')) {
                // A set of frames without a time lasts forever, so just
                // use the last frame we just got.
                return frame;
            }
            passed += frames.time;
        }
    }

    // We're at the end, return the last frame we looked at.
    return frame;
};

/**
 * Bottom boundary of an entity.
 *
 * @param config Configuration of entity.
 * @param pos Position of entity.
 */
export const entityBottom = (config: EntityConfig, pos: vec3): number => {
    if (config.grounded === true) {
        return pos[2];
    }
    return pos[2] - config.height / 2;
}

/**
 * Top boundary of an entity.
 *
 * @param config Configuration of entity.
 * @param pos Position of entity.
 */
export const entityTop = (config: EntityConfig, pos: vec3): number => {
    if (config.grounded === true) {
        return pos[2] + config.height;
    }
    return pos[2] + config.height / 2;
}
