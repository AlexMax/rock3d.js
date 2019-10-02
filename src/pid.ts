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

 /**
  * PID state.
  */
export interface PID {
    /**
     * Proportional multiplier.
     */
    p: number,

    /**
     * Integral multiplier.
     */
    i: number,

    /**
     * Derivative multiplier.
     */
    d: number,

    /**
     * Proportional error - always the most recent error.
     */
    pError: number,

    /**
     * Integral error - accumulates over time.
     */
    iError: number,

    /**
     * Derivative error - difference between two most recent error values.
     */
    dError: number,
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
