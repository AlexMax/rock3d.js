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
 * Information for a specific texture.
 */
export interface TextureInfo {
    xCenter: number;
    yCenter: number;
}

/**
 * A loaded texture.
 */
export interface Texture {
    name: string;
    img: HTMLImageElement;
    info: TextureInfo;
}

interface AtlasEntry {
    texture: Texture;
    xPos: number;
    yPos: number;
}

interface AtlasShelf {
    width: number;
    height: number;
}

type AtlasHash = Map<string, AtlasEntry>;

export type PersistProc = (tex: Texture, x: number, y: number) => void;

export class Atlas {
    atlas: AtlasHash;
    length: number; // Length of one side of the texture atlas - it's square
    shelves: AtlasShelf[];

    constructor(size: number) {
        this.atlas = new Map();
        this.length = size;
        this.shelves = [];
    }

    add(tex: Texture): void {
        // Add padding on each side of the texture.
        const actualWidth = tex.img.width + 2;
        const actualHeight = tex.img.height + 2;

        if (actualWidth > this.length || actualHeight > this.length) {
            throw new Error("Texture is too big for the atlas");
        }

        let y = 0;
        for (let i = 0;i < this.shelves.length;i++) {
            const shelf = this.shelves[i];
            // Can the shelf hold it?
            if (actualHeight <= shelf.height) {
                // Is there space on the shelf?
                if (actualWidth <= this.length - shelf.width) {
                    // There is!  Put the atlas entry there, then adjust the shelf.
                    this.atlas.set(tex.name, {
                        texture: tex,
                        xPos: shelf.width + 1,
                        yPos: y + 1
                    });
                    shelf.width += actualWidth;

                    return;
                }
            }

            // No room on this shelf, go to the next...
            y += shelf.height;
        }

        // We have no space in any of our existing shelves.  Do we have space
        // for a new shelf?
        if (actualHeight <= this.length - y) {
            // We do!  Create the new shelf and put the atlas entry there.
            this.shelves.push({
                width: actualWidth,
                height: actualHeight,
            });
            this.atlas.set(tex.name, {
                texture: tex,
                xPos: 1,
                yPos: y + 1
            });

            return;
        }

        throw new Error('No space left in texture atlas');
    }

    /**
     * Persist the atlas onto the GPU.
     * 
     * @param p Function that actually does the persisting to the GPU.
     */
    persist(p: PersistProc): void {
        for (const [_, entry] of this.atlas) {
            p(entry.texture, entry.xPos, entry.yPos);
        }
    }

    /**
     * Find and return the atlas entry given the name.
     * 
     * @param name The name of the texture to find.
     */
    find(name: string): AtlasEntry | null {
        const entry = this.atlas.get(name);
        return entry ? entry : null;
    }
}
