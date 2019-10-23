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

export const isTwoTuple = <T>(tup: unknown, type: string): tup is [T, T]  => {
    if (!Array.isArray(tup)) {
        return false;
    }
    if (typeof tup[0] !== type || typeof tup[1] !== type) {
        return false;
    }
    return true;
}

export const isThreeTuple = <T>(
    tup: unknown, type: string
): tup is [T, T, T] => {
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

export const isFourTuple = <T>(
    tup: unknown, type: string
): tup is [T, T, T, T] => {
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