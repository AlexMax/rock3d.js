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

import { Assets } from '../client/asset';
import { Atlas } from '../atlas';
import { RenderContext } from './render';

/**
 * Size of texture atlas.
 */
const ATLAS_SIZE = 512;

/**
 * A loaded texture.
 */
export interface Texture {
    name: string;
    img: HTMLImageElement;
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

export const loadRendererAssets = (
    renderer: RenderContext,
    assets: Assets,
): void => {
    // Load all of our textures into texture and sprite map.
    const textures: Texture[] = [];
    const sprites: Texture[] = [];
    for (const [key, value] of assets.entries()) {
        const tMatch = key.match(/texture\/(.+)\..+/);
        const sMatch = key.match(/sprite\/(.+)\..+/);
        if (Array.isArray(tMatch) && tMatch.length >= 2 && value.type === 'Image') {
            textures.push({
                name: tMatch[1],
                img: value.data
            });
        } else if (Array.isArray(sMatch) && sMatch.length >= 2 && value.type === 'Image') {
            sprites.push({
                name: sMatch[1],
                img: value.data
            });
        }
    }

    // Load our textures into the atlas.
    const texAtlas = new Atlas(ATLAS_SIZE);
    for (let i = 0;i < textures.length;i++) {
        const { name, img } = textures[i];
        texAtlas.add(name, img);
    }

    // Persist the atlas to the GPU.
    renderer.world.bakeTextureAtlas(texAtlas);

    // Load our sprites into the atlas.
    const spriteAtlas = new Atlas(ATLAS_SIZE);
    for (let i = 0;i < sprites.length;i++) {
        const { name, img } = sprites[i];
        spriteAtlas.add(name, img);
    }

    // Persist the atlas to the GPU.
    renderer.world.bakeSpriteAtlas(spriteAtlas);
}

export const localFileLoader = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('error', () => {
            reader.abort();
            reject(new Error('Could not read file'));
        });
        reader.addEventListener('load', () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Unexpected result type'));
                return;
            }
            resolve(reader.result);
        });
        reader.readAsText(file);
    });
}
