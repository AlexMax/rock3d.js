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

/**
 * A loaded texture.
 */
export interface Texture {
    name: string;
    img: HTMLImageElement;
};

/**
 * Round a number to the nearest multiple.
 */
export const mround = (num: number, multi: number) => {
    return Math.round(num / multi) * multi;
}

/**
 * Asynchronously load an image and resolves the returned promise when the
 * image finishes loading, or rejects it if there was an error.
 * 
 * @param name Original name of the texture.
 * @param src Source URL of image.
 */
export const textureLoader = (name: string, src: string): Promise<Texture> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                name: name,
                img: img,
            });
        };
        img.onerror = () => {
            reject(new Error(`Error attempting to load image ${name}:${src}`));
        };
        img.src = src;
    });
}
