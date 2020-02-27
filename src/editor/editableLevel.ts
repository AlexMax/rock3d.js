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

import { vec2 } from 'gl-matrix';

import { createLevel,  MutableLevel, SerializedLevel } from '../level';

interface VertexPolys {
    /**
     * Polygons with this vertex inside it.
     */
    polys: number[],

    /**
     * Vertex to keep track of.  This is a reference, not a copy.
     */
    vertex: vec2;
}

class VertexCache extends Map<String, VertexPolys> {

    constructor(level: MutableLevel) {
        super();
        const polys = level.polygons;
        for (let i = 0;i < polys.length;i++) {
            const poly = polys[i];
            for (let j = 0;j < poly.edgeIDs.length;j++) {
                const edge = level.edges[poly.edgeIDs[j]];
                const hash = edge.vertex.toString();
                if (!this.has(hash)) {
                    // Vertex does not exist, create a new entity in the cache.
                    this.set(hash, {
                        vertex: edge.vertex,
                        polys: [i],
                    });
                } else {
                    // Vertex does exist, push our poly to it.
                    const cachedVert = this.get(hash) as VertexPolys;
                    cachedVert.polys.push(i);
                }
            }
        }
    }

    /**
     * Return a plain array of vertexes.
     */
    toArray(): vec2[] {
        const out: vec2[] = [];
        this.forEach((vertex) => {
            out.push(vertex.vertex);
        });
        return out;
    }
}

/**
 * A EditableLevel is a Level that has additional fields specifically needed
 * by the editor that are irrelevant for actually playing the game.
 */
export interface EditableLevel extends MutableLevel {
    vertexCache: VertexCache;
}

export const createEditableLevel = (level: SerializedLevel): EditableLevel => {
    const newLevel = createLevel(level);
    return {
        ...newLevel,
        vertexCache: new VertexCache(newLevel),
    };
}
