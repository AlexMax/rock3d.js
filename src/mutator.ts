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

import { Snapshot } from "./snapshot";

export interface MutatorConfig {
    /**
     * Name of the mutator, for informational or debugging purposes.
     */
    name: string;

    /**
     * Thinker function.
     */
    think: (snap: Snapshot) => void;
}

/**
 * Lift config.
 */
export const liftConfig: MutatorConfig = {
    name: "Lift",
    think: (snap) => {

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
