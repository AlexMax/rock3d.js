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
import { Atlas, Texture } from '../atlas';
import { RenderContext } from './render';
import { isObject, objectHasKey } from '../util';

/**
 * Size of texture atlas.
 */
const ATLAS_SIZE = 512;

interface SerializedTextureInfo {
    xCenter?: number;
    yCenter?: number;
}

interface SerializedTextureInfos {
    [name: string]: SerializedTextureInfo | undefined;
};

/**
 * Type guard for serialized TextureInfos.
 */
export function assertSerializedTextureInfos(
    infos: unknown
): asserts infos is SerializedTextureInfos {
    if (!isObject(infos)) {
        throw new Error('info is not an object');
    }
    for (const name in infos) {
        const info = infos[name];
        if (!isObject(info)) {
            throw new Error(`infos ${name} is not an object`);
        }
        if (objectHasKey('xCenter', info) && typeof info.xCenter !== 'number') {
            throw new Error('info xCenter is not a number');
        }
        if (objectHasKey('yCenter', info) && typeof info.yCenter !== 'number') {
            throw new Error('info yCenter is not a number');
        }
    }
}

/**
 * Load assets into the passed renderer context.
 * 
 * @param renderer Renderer context.
 * @param assets Assets to load.
 */
export const loadRendererAssets = (
    renderer: RenderContext,
    assets: Assets,
): void => {
    // Load up sprite information.
    const spriteinfoLump = assets.get('sprite/SPRITEINFO.json');
    var spriteinfo: SerializedTextureInfos = {};
    if (spriteinfoLump && spriteinfoLump.type === 'JSON') {
        assertSerializedTextureInfos(spriteinfoLump.data);
        spriteinfo = spriteinfoLump.data;
    }

    // Load all of our textures into texture and sprite map.
    const textures: Texture[] = [];
    const sprites: Texture[] = [];
    for (const [key, value] of assets.entries()) {
        const tMatch = key.match(/texture\/(.+)\..+/);
        const sMatch = key.match(/sprite\/(.+)\..+/);
        if (Array.isArray(tMatch) && tMatch.length >= 2 && value.type === 'Image') {
            textures.push({
                name: tMatch[1],
                img: value.data,
                info: {
                    xCenter: value.data.width / 2,
                    yCenter: value.data.height / 2,
                },
            });
        } else if (Array.isArray(sMatch) && sMatch.length >= 2 && value.type === 'Image') {
            const sinfo = spriteinfo[sMatch[1]];
            sprites.push({
                name: sMatch[1],
                img: value.data,
                info: {
                    xCenter: (sinfo && sinfo.xCenter) ? sinfo.xCenter : value.data.width / 2,
                    yCenter: (sinfo && sinfo.yCenter) ? sinfo.yCenter : value.data.height / 2,
                },
            });
        }
    }

    // Load our textures into the atlas.
    const texAtlas = new Atlas(ATLAS_SIZE);
    for (let i = 0;i < textures.length;i++) {
        texAtlas.add(textures[i]);
    }

    // Persist the atlas to the GPU.
    renderer.bakeTextureAtlas(texAtlas);

    // Load our sprites into the atlas.
    const spriteAtlas = new Atlas(ATLAS_SIZE);
    for (let i = 0;i < sprites.length;i++) {
        spriteAtlas.add(sprites[i]);
    }

    // Persist the atlas to the GPU.
    renderer.bakeSpriteAtlas(spriteAtlas);
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
