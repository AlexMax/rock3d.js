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
