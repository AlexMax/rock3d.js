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

import { Atlas } from '../atlas';
import { RenderContext } from '../r3d/render';

// Textures
import BROWN96 from '../../asset/BROWN96.png';
import CEIL5_1 from '../../asset/CEIL5_1.png';
import F_SKY1 from '../../asset/F_SKY1.png';
import FLAT14 from '../../asset/FLAT14.png';
import FLAT2 from '../../asset/FLAT2.png';
import FLOOR4_8 from '../../asset/FLOOR4_8.png';
import GRASS1 from '../../asset/GRASS1.png';
import RROCK18 from '../../asset/RROCK18.png';
import SKY1 from '../../asset/SKY1.png';
import STARTAN3 from '../../asset/STARTAN3.png';
import STEP3 from '../../asset/STEP3.png';

// Sprites
import PLAYA1 from '../../asset/PLAYA1.png';
import PLAYA2A8 from '../../asset/PLAYA2A8.png';
import PLAYA3A7 from '../../asset/PLAYA3A7.png';
import PLAYA4A6 from '../../asset/PLAYA4A6.png';
import PLAYA5 from '../../asset/PLAYA5.png';

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
};

/**
 * Asynchronously load an image and resolves the returned promise when the
 * image finishes loading, or rejects it if there was an error.
 * 
 * @param name Original name of the texture.
 * @param src Source URL of image.
 */
export function textureLoader(name: string, src: string): Promise<Texture> {
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

export const loadAssets = async (renderer: RenderContext) => {
    // Wait to load all of our textures.
    const textures = await Promise.all([
        textureLoader('BROWN96', BROWN96),
        textureLoader('CEIL5_1', CEIL5_1),
        textureLoader('F_SKY1', F_SKY1),
        textureLoader('FLAT14', FLAT14),
        textureLoader('FLAT2', FLAT2),
        textureLoader('FLOOR4_8', FLOOR4_8),
        textureLoader('GRASS1', GRASS1),
        textureLoader('RROCK18', RROCK18),
        textureLoader('SKY1', SKY1),
        textureLoader('STARTAN3', STARTAN3),
        textureLoader('STEP3', STEP3),
    ]);

    // Load our textures into the atlas.
    const texAtlas = new Atlas(ATLAS_SIZE);
    for (let i = 0;i < textures.length;i++) {
        const { name, img } = textures[i];
        texAtlas.add(name, img);
    }

    // Persist the atlas to the GPU.
    renderer.world.bakeTextureAtlas(texAtlas);

    // Wait to load all of our sprites.
    const sprites = await Promise.all([
        textureLoader('PLAYA1', PLAYA1),
        textureLoader('PLAYA2A8', PLAYA2A8),
        textureLoader('PLAYA3A7', PLAYA3A7),
        textureLoader('PLAYA4A6', PLAYA4A6),
        textureLoader('PLAYA5', PLAYA5),
    ]);

    // Load our textures into the atlas.
    const spriteAtlas = new Atlas(ATLAS_SIZE);
    for (let i = 0;i < sprites.length;i++) {
        const { name, img } = sprites[i];
        spriteAtlas.add(name, img);
    }

    // Persist the atlas to the GPU.
    renderer.world.bakeSpriteAtlas(spriteAtlas);
}
