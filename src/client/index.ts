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

import { Client } from './client'; 
import { RenderContext } from '../r3d/render';

import { loadAssets } from './loader';

window.addEventListener("load", async () => {
    // Get our client element.
    const root = document.getElementById('client');
    if (root === null) {
        throw new Error('Could not find root element');
    }

    // Create an element to hold our renderer
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    root.appendChild(canvas);

    // Create the 3D renderer.
    const renderer = new RenderContext(canvas);

    // Load our assets.
    await loadAssets(renderer);

    // Create our connection.
    const client = new Client(renderer);

    const draw = () => {
        client.tick();
        window.requestAnimationFrame(draw);
    }
    window.requestAnimationFrame(draw);
});

