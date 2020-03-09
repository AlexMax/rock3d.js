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

import { Mutable, Immutable } from "./util";

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

export type MutableInput = Mutable<{
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
}>

export type Input = Immutable<MutableInput>;

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
export const createInput = (): MutableInput => {
    return {
        pressed: 0,
        released: 0,
        pitch: 0,
        yaw: 0,
    } as MutableInput;
}

/**
 * Clone an input object into a new object.
 * 
 * @param input Input object to clone.
 */
export const cloneInput = (input: Input): MutableInput => {
    return {
        pressed: input.pressed,
        released: input.released,
        pitch: input.pitch,
        yaw: input.yaw,
    } as MutableInput;
}

/**
 * Set a button on a bitfield.
 * 
 * @param buttons Button bitfield.
 * @param set Button to set.
 */
export const setButton = (buttons: number, set: Button): number => {
    return buttons | (1 << set);
}

/**
 * Unset a button on a bitfield.
 * 
 * @param buttons Button bitfield.
 * @param unset Button to unset.
 */
export const unsetButton = (buttons: number, unset: Button): number => {
    return buttons & ~(1 << unset);
}

/**
 * Set a pressed button on an Input.
 * 
 * @param out Input to mutate.
 * @param input Source input.
 * @param set Button to set.
 */
export const setPressed = (
    out: MutableInput, input: Input, pressed: Button
): MutableInput => {
    out.pressed = input.pressed | (1 << pressed);
    return out;
}

/**
 * Unset buttons on an Input.
 * 
 * @param out Input to mutate.
 * @param input Input to work from.
 * @param unset Button to unset.
 */
export const setReleased = (
    out: MutableInput, input: Input, released: Button
): MutableInput => {
    out.released = input.released | (1 << released);
    return out;
}

/**
 * Check to see if a particular button is set on a bitfield.
 * 
 * @param buttons Button bitfield.
 * @param button Button to check.
 */
export const checkButton = (buttons: number, button: number): boolean => {
    return (buttons & (1 << button)) > 0 ? true : false;
}

/**
 * Check to see if a particular button was just pressed.
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
    return (input.released & (1 << button)) > 0 ? true : false;
}

const updateButton = (
    buttons: number, input: Input, button: Button
): number => {
    let newButtons = buttons;
    if ((input.pressed & (1 << button)) > 0) {
        newButtons |= (1 << button);
    }
    if ((input.released & (1 << button)) > 0) {
        newButtons &= ~(1 << button);
    }
    return newButtons;
}

/**
 * Update buttons bitfield based on passed inputs.
 * 
 * @param buttons Button bitfield to update.
 * @param input Inputs to use to mutate bitfield.
 */
export const updateButtons = (buttons: number, input: Input): number => {
    let newButtons = buttons;
    newButtons = updateButton(newButtons, input, Button.WalkForward);
    newButtons = updateButton(newButtons, input, Button.WalkBackward);
    newButtons = updateButton(newButtons, input, Button.StrafeLeft);
    newButtons = updateButton(newButtons, input, Button.StrafeRight);
    newButtons = updateButton(newButtons, input, Button.Attack);
    newButtons = updateButton(newButtons, input, Button.Jump);
    newButtons = updateButton(newButtons, input, Button.Use);
    return newButtons;
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
 * Clear buttons on an Input.
 * 
 * @param out Input to mutate.
 */
export const clearInput = (out: MutableInput): MutableInput => {
    out.pressed = 0;
    out.released = 0;
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
