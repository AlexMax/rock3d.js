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
 * Generate a function that detects membership in an enum.
 * 
 * Thanks to AnyhowStep https://stackoverflow.com/a/60032219/91642 for his help.
 * 
 * @param e Enum to generate function for.
 */
export const generateIsEnum = <T>(e: T): (token: unknown) => token is T[keyof T] => {
    const keys = Object.keys(e).filter((k) => {
        return !/^\d/.test(k);
    });
    const values = keys.map((k) => {
        return (e as any)[k];
    });
    return (token: unknown): token is T[keyof T] => {
        return values.includes(token);
    };
};

/**
 * Type guard for an object with a particular key.
 *
 * @param k Key to check.
 * @param o Object to check inside.
 */
export const objectHasKey = <K extends string>(
    k: K, o: object
): o is { [_ in K]: object } => {
    if (!(k in o)) {
        return false;
    }
    return true;
}

/**
 * Returns true if passed parameter is an object.
 * 
 * You can't really do anything useful with `object`, so instead we assert
 * that the passed parameter is a record type of string keys and unknown
 * values.
 * 
 * @param x Checked parameter.
 */
export const isObject = (x: unknown): x is Record<string, unknown> => {
    if (typeof x !== 'object') {
        return false;
    }
    if (x === null) {
        return false;
    }
    return true;
}

/**
 * Returns true if the passed item is a two-tuple of the specific
 * JavaScript type.
 * 
 * @param tup Checked parameter.
 * @param type Type to check against.
 */
export function isTwoTuple(tup: unknown, type: "string"): tup is [string, string];
export function isTwoTuple(tup: unknown, type: "number"): tup is [number, number];
export function isTwoTuple(
    tup: unknown, type: "string" | "number"
): tup is [string, string] | [number, number] {
    if (!Array.isArray(tup)) {
        return false;
    }
    if (typeof tup[0] !== type || typeof tup[1] !== type) {
        return false;
    }
    return true;
}

/**
 * Returns true if the passed item is a three-tuple of the specific
 * JavaScript type.
 * 
 * @param tup Checked parameter.
 * @param type Type to check against.
 */
export function isThreeTuple(
    tup: unknown, type: "string"
): tup is [string, string, string];
export function isThreeTuple(
    tup: unknown, type: "number"
): tup is [number, number, number];
export function isThreeTuple(
    tup: unknown, type: "string" | "number"
): tup is [string, string, string] | [number, number, number] {
    if (!Array.isArray(tup)) {
        return false;
    }
    if (typeof tup[0] !== type || typeof tup[1] !== type) {
        return false;
    }
    if (typeof tup[2] !== type) {
        return false;
    }
    return true;
}

/**
 * Returns true if the passed item is a four-tuple of the specific
 * JavaScript type.
 * 
 * @param tup Checked parameter.
 * @param type Type to check against.
 */
export function isFourTuple(
    tup: unknown, type: "string"
): tup is [string, string, string, string];
export function isFourTuple(
    tup: unknown, type: "number"
): tup is [number, number, number, number];
export function isFourTuple(
    tup: unknown, type: "string" | "number"
): tup is [string, string, string, string] | [number, number, number, number] {
    if (!Array.isArray(tup)) {
        return false;
    }
    if (typeof tup[0] !== type || typeof tup[1] !== type) {
        return false;
    }
    if (typeof tup[2] !== type || typeof tup[3] !== type) {
        return false;
    }
    return true;
}

