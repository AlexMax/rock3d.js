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

export enum Axis { 
    Yaw,
    Pitch,
}

export enum Button {
    WalkForward,
    WalkBackwards,
    StrafeLeft,
    StrafeRight,
    Attack,
    Jump,
    Use,
}

/**
 * Set buttons on an existing bitfield.
 * 
 * @param input Input bitset.
 * @param set Bits to set.
 */
export const setButton = (input: number, set: number): number => {
    return input | set;
}

/**
 * Unset buttons on an existing bitfield.
 * 
 * @param input Input bitset.
 * @param unset Bits to unset.
 */
export const unsetButton = (input: number, unset: number): number => {
    return input & ~unset;
}
