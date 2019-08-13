/**
 * rocked.js: An editor for the rock3d engine.
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

import * as rock3d from 'rock3d';

import { textureLoader } from './util';

import CEIL5_1 from './asset/CEIL5_1.png';
import FLOOR4_8 from './asset/FLOOR4_8.png';
import STARTAN3 from './asset/STARTAN3.png';

window.addEventListener("load", async () => {
    // Wait to load all of our textures.
    const textures = await Promise.all([
        textureLoader('CEIL5_1', CEIL5_1),
        textureLoader('FLOOR4_8', FLOOR4_8),
        textureLoader('STARTAN3', STARTAN3)
    ]);

    // Load our textures into the atlas.
    const atlas = new rock3d.Atlas.Atlas(512);
    for (let i = 0;i < textures.length;i++) {
        const { name, img } = textures[i];
        atlas.add(name, img);
    }

    // Create canvas
    const root = document.getElementById('rocked');
    if (root === null) {
        throw new Error('Could not find root element');
    }

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    root.appendChild(canvas);

    // Initialize a view on the given canvas
    const renderer = new rock3d.Render.RenderContext(canvas);
    renderer.render(new rock3d.Camera.Camera());
});
