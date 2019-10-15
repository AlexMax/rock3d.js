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

import { vec2 } from 'gl-matrix';

import { SerializedEdge } from '../edge';
import {
    createLevel, isSerializedLevel, MutableLevel, SerializedLevel
} from '../level';
import { SerializedPolygon } from '../polygon';

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
