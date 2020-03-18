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
 * A explicitly mutable type that won't accept Immutable types.
 * 
 * Any Mutable object should be constructed without the __mutable property
 * by using a type assertion.
 */
export type Mutable<T> = T & {
    /**
     * This property is fake and doesn't actually exist.
     */
    __mutable: true
};

/**
 * Turn a Mutable type Immutable.
 * 
 * Immutable types cannot be passed to functions that want Mutable types.
 */
export type Immutable<T> = Omit<Readonly<T>, "__mutable">;

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

/**
 * Create a "swizzled" view of a numeric array.
 * 
 * This function returns a proxy that exposes a mixed-up view of the original
 * array.  Getting and setting operations are passed through to the original
 * array, but the indexes read to and written from are changed according
 * to the swizzle indexes in the second parameter.
 * 
 * @param a Array to swizzle.
 * @param i Array indexes to use instead of the defaults.
 */
export const swizzle: {
    (a: number[] | Float32Array | Readonly<Float32Array>, i: [number, number]): [number, number];
    (a: number[] | Float32Array | Readonly<Float32Array>, i: [number, number, number]): [number, number, number];
    (a: number[] | Float32Array | Readonly<Float32Array>, i: [number, number, number, number]): [number, number, number, number];
} = (a: any, i: any) => {
    return new Proxy(a, {
        get: (target, property, receiver) => {
            // Symbols are always deferred.
            if (typeof property === 'symbol') {
                return Reflect.get(target, property, receiver);
            }

            // Try and parse a number and if we can't, then we're trying to
            // access a string property and need to do further chicanery.
            const nprop = typeof property === 'number' ?
                property : parseInt(property);
            if (isNaN(nprop)) {
                // Array length is the swizzled length, not the original.
                if (property === 'length') {
                    return i.length;
                }

                // This is safer than silently deferring.
                throw new Error(`Unhandled swizzled property ${property}`);

                // Uncomment this when you have a reasonable expectation
                // that all corner cases are being handled.
                // return Reflect.get(target, property, receiver);
            }

            // Swizzle according to our index in the array.
            return target[i[nprop]];
        },
        set: (target, property, value): boolean => {
            // Symbols are always errors.
            if (typeof property === 'symbol') {
                // Do not set arbitrary properties.  The proxy is a view
                // of an underlying array, and it really doesn't make sense
                // to mutate either the proxy itself or the underlying array
                // through the proxy except in a few very obvious and very
                // specific ways.
                return false;
            }

            // Try and parse a number and if we can't, error.
            const nprop = typeof property === 'number' ?
                property : parseInt(property);
            if (isNaN(nprop)) {
                // Do not set arbitrary properties, same reasoning as above.
                return false;
            }

            // Swizzle according to our index in the array.
            if (nprop < 0 || nprop >= i.length) {
                // Do not set out of bounds swizzle indexes.
                return false;
            }
            target[i[nprop]] = value;
            return true;
        }
    });
}
