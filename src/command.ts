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
     * Currently pressed buttons as a bitfield.
     */
    buttons: number,

    /**
     * Current pitch axis.
     */
    pitch: number,

    /**
     * Current yaw axis.
     */
    yaw: number,
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

/**
 * Set buttons on an existing bitfield.
 * 
 * @param input Input bitset.
 * @param set Button to set.
 */
export const setButton = (input: number, set: Button): number => {
    return input | (1 << set);
}

/**
 * Unset buttons on an existing bitfield.
 * 
 * @param input Input bitset.
 * @param unset Button to unset.
 */
export const unsetButton = (input: number, unset: Button): number => {
    return input & ~(1 << unset);
}

/**
 * Check to see if a particular button is pressed.
 * 
 * @param input Input bitset.
 * @param button Button to check.
 */
export const checkButton = (input: number, button: number): boolean => {
    return (input & (1 << button)) > 0 ? true : false;
}
