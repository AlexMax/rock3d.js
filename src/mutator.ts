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

import { Level } from "./level";
import { Snapshot } from "./snapshot";

export interface MutatorConfig {
    /**
     * Name of the mutator, for informational or debugging purposes.
     */
    name: string;

    /**
     * Thinker function.
     */
    think: (snap: Snapshot, level: Level, period: number) => void;
}

/**
 * Lift config.
 */
export const liftConfig: MutatorConfig = {
    name: "Lift",
    think: (snap, level, period) => {
        snap.level.polygons[7] = {
            ...level.polygons[7],
            floorHeight: 24,
        }
    }
}

export interface Mutator {
    /**
     * Configuration of mutator.
     */
    config: MutatorConfig;

    /**
     * Tic that mutator was activated on.
     */
    activated: number;
}

export interface SerializedMutator {
    config: string;
    activated: number;
}

/**
 * Convert native mutator into JSON-friendly serialized mutator.
 * 
 * @param mutator Native mutator to serialize.
 */
export const serializeMutator = (mut: Mutator): SerializedMutator => {
    return {
        config: mut.config.name,
        activated: mut.activated,
    };
}

/**
 * Convert serialized mutator into native mutator.
 * 
 * @param entity Serialized mutator to unserialize.
 */
export const unserializeMutator = (mut: SerializedMutator): Mutator => {
    return {
        config: liftConfig,
        activated: mut.activated,
    };
}
