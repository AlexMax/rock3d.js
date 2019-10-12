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

export enum Axis { 
    Pitch,
    Yaw,
}

export enum Button {
    WalkForward,
    WalkBackward,
    StrafeLeft,
    StrafeRight,
    Attack,
    Jump,
    Use,
}

interface MutableInput {
    /**
     * Newly-pressed buttons as a bitfield.
     */
    pressed: number;

    /**
     * Newly-released buttons as a bitfield.
     */
    released: number;

    /**
     * Current pitch axis.
     */
    pitch: number;

    /**
     * Current yaw axis.
     */
    yaw: number;
}

export type Input = Readonly<MutableInput>;

export enum CommandTypes {
    /**
     * Inputs from a client.
     */
    Input,

    /**
     * Player joins or leaves the state.
     */
    Player,
}

/**
 * Construct a new input object.
 */
export const createInput = (): Input => {
    return {
        pressed: 0, released: 0, pitch: 0, yaw: 0
    };
}

/**
 * Clone an input object into a new object.
 * 
 * @param input Input object to clone.
 */
export const cloneInput = (input: Input): MutableInput => {
    return {...input};
}

/**
 * Set buttons on an Input.
 * 
 * @param out Input to mutate.
 * @param input Source input.
 * @param set Button to set.
 */
export const setButton = (
    out: MutableInput, input: Input, set: Button
): MutableInput => {
    out.pressed = input.pressed | (1 << set);
    return out;
}

/**
 * Unset buttons on an Input.
 * 
 * @param out Input to mutate.
 * @param input Input to work from.
 * @param unset Button to unset.
 */
export const unsetButton = (
    out: MutableInput, input: Input, unset: Button
): MutableInput => {
    out.released = input.released | (1 << unset);
    return out;
}

/**
 * Check to see if a particular button is pressed.
 * 
 * @param input Input to check.
 * @param button Button to check.
 */
export const checkPressed = (input: Input, button: number): boolean => {
    return (input.pressed & (1 << button)) > 0 ? true : false;
}

/**
 * Check to see if a particular button is released.
 * 
 * @param input Input to check.
 * @param button Button to check.
 */
export const checkReleased = (input: Input, button: number): boolean => {
    return (input.pressed & (1 << button)) > 0 ? true : false;
}

/**
 * Clear buttons on an Input.
 * 
 * @param out Input to mutate.
 */
export const clearButtons = (out: MutableInput): MutableInput => {
    out.pressed = 0;
    out.released = 0;
    return out;
}

/**
 * Accumulate the axis on an Input.
 * 
 * @param out Input to mutate.
 * @param input Input to work from.
 * @param pitch Pitch to accumulate.
 * @param yaw Yaw to accumulate.
 */
export const setAxis = (
    out: MutableInput, input: Input, pitch: number, yaw: number
): MutableInput => {
    out.pitch = input.pitch + pitch;
    out.yaw = input.yaw + yaw;
    return out;
}

/**
 * Clear axis on an Input.
 * 
 * @param out Input to mutate.
 */
export const clearAxis = (out: MutableInput): MutableInput => {
    out.pitch = 0;
    out.yaw = 0;
    return out;
}

export interface InputCommand {
    type: CommandTypes.Input;

    /**
     * Client ID that command belongs to.
     */
    clientID: number;

    /**
     * Client predicted clock of inputs.
     */
    clock: number;

    /**
     * Actual input.
     */
    input: Input;
}

export interface PlayerCommand {
    type: CommandTypes.Player;

    /**
     * Client ID of the player.
     */
    clientID: number;

    /**
     * Action to take with the player.
     */
    action: 'add' | 'remove';
}

export type Command = InputCommand | PlayerCommand;
