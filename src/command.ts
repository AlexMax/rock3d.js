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
     * Currently pressed buttons as a bitfield.
     */
    buttons: number;

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
        buttons: 0, pitch: 0, yaw: 0
    };
}

/**
 * Set buttons on an Input.
 * 
 * @param input Input to work from.
 * @param set Button to set.
 */
export const setButton = (input: Input, set: Button): Input => {
    return {
        ...input,
        buttons: input.buttons | (1 << set),
    };
}

/**
 * Unset buttons on an Input.
 * 
 * @param input Input to work from.
 * @param unset Button to unset.
 */
export const unsetButton = (input: Input, unset: Button): Input => {
    return {
        ...input,
        buttons: input.buttons & ~(1 << unset),
    };
}

/**
 * Check to see if a particular button is pressed.
 * 
 * @param input Input to check.
 * @param button Button to check.
 */
export const checkButton = (input: Input, button: number): boolean => {
    return (input.buttons & (1 << button)) > 0 ? true : false;
}

/**
 * Accumulate the axis on an Input.
 */
export const setAxis = (input: Input, pitch: number, yaw: number): Input => {
    return {
        ...input,
        pitch: input.pitch + pitch,
        yaw: input.yaw + yaw,
    };
}

/**
 * Clear axis on an Input.
 */
export const clearAxis = (input: Input): Input => {
    return {
        ...input,
        pitch: 0,
        yaw: 0,
    };
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
