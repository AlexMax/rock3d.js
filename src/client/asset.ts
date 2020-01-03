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

import { parse as contentParse } from 'content-type';

import { objectHasKey } from '../util';

interface Files {
    files: string[];
}

interface JSONAsset {
    type: "JSON";
    data: any;
}

interface ImageAsset {
    type: "Image";
    data: HTMLImageElement;
}

interface TextAsset {
    type: "Text";
    data: string;
}

/**
 * One of many possible assets.
 */
type Asset = JSONAsset | ImageAsset | TextAsset;

/**
 * Asset directory.
 */
export type Assets = Map<string, Asset>;

function assertIsFiles(json: unknown): asserts json is Files {
    if (typeof json !== 'object' || json === null) {
        throw new Error('files is not an object');
    }

    if (!objectHasKey("files", json)) {
        throw new Error('files does not have files key');
    }

    if (!Array.isArray(json.files)) {
        throw new Error('files key is not an array');
    }

    for (const file of json.files) {
        if (typeof file !== 'string') {
            throw new Error('files array contains a non-string');
        }
    }
}

/**
 * Turn image data into an image element.
 * 
 * @param url URL of image to load, only used for error reporting.
 * @param data Data blob to use as image data.
 */
const imgParse = async (url: string, data: Blob): Promise<HTMLImageElement> => {
    const src = URL.createObjectURL(data);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = (): void => {
            resolve(img);
        };
        img.onerror = (): void => {
            reject(new Error(`Could not load image ${url}.`));
        };
        img.src = src;
    });
}

/**
 * Load a single asset.
 * 
 * @param url URL of specific asset to load.
 */
const loadAsset = async (url: string): Promise<Asset> => {
    const req = new Request(url, {
        redirect: 'follow'
    });

    const res = await fetch(req);
    if (res.ok === false) {
        throw new Error(`Could not download asset ${url}.`);
    }
    if (res.arrayBuffer === null) {
        throw new Error(`Asset ${url} has no content.`);
    }

    const contentType = res.headers.get('Content-Type');
    if (contentType === null) {
        throw new Error(`Asset ${url} has no Content-Type.`);
    }

    const mime = contentParse(contentType);
    switch (mime.type) {
    case 'application/json':
        return {
            type: 'JSON',
            data: JSON.parse(await res.text()),
        }
    case 'image/png':
        return {
            type: 'Image',
            data: await imgParse(url, await res.blob()),
        }
    case 'text/plain':
        return {
            type: "Text",
            data: await res.text(),
        }
    default:
        throw new Error(`Asset ${url} has unknown Content-Type.`);
    }
}

/**
 * Load an asset directory from a URL.
 * 
 * @param url Base URL of assets to load.
 */
export const loadAssets = async (url: string): Promise<Assets> => {
    const req = new Request(url + '/files.json', {
        redirect: 'follow'
    });
    const res = await fetch(req);
    if (res.ok === false) {
        throw new Error('Could not download asset file list - did you build-files?');
    }
    const files = JSON.parse(await res.text());
    assertIsFiles(files);

    // Fetch all the assets.
    const fetches: Promise<Asset>[] = [];
    for (const file of files.files) {
        fetches.push(loadAsset(url + '/' + file));
    }

    // Zip them up into an asset map.
    const assets: Assets = new Map();
    const buffers = await Promise.all(fetches);
    for (let i = 0;i < files.files.length;i++) {
        assets.set(files.files[i], buffers[i]);
    }
    return assets;
}
