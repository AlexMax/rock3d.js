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

 /**
  * PID state.
  */
export interface PID {
    /**
     * Proportional multiplier.
     */
    p: number;

    /**
     * Integral multiplier.
     */
    i: number;

    /**
     * Derivative multiplier.
     */
    d: number;

    /**
     * Proportional error - always the most recent error.
     */
    pError: number;

    /**
     * Integral error - accumulates over time.
     */
    iError: number;

    /**
     * Derivative error - difference between two most recent error values.
     */
    dError: number;
}

/**
 * Create a new PID object.
 * 
 * @param p Proportional parameter.
 * @param i Integral parameter.
 * @param d Derivative parameter.
 */
export const createPID = (p: number, i: number, d: number): PID => {
    return {
        p: p,
        i: i,
        d: d,
        pError: 0,
        iError: 0,
        dError: 0,
    };
}

/**
 * Tick the PID controller with an error value.
 * 
 * @param pid PID to use as our source.
 * @param error Error to add to PID object.
 */
export const updatePID = (pid: PID, error: number): PID => {
    return {
        ...pid,
        pError: error,
        iError: pid.iError + error,
        dError: error - pid.pError,
    };
}

/**
 * Calculate output based on PID.
 * 
 * @param pid PID to use as our source.
 */
export const calculatePID = (pid: PID): number => {
    return pid.p * pid.pError + pid.i * pid.iError + pid.d * pid.dError;
}
