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

import { glMatrix, vec2 } from 'gl-matrix';
import { Atlas, Render, Camera } from 'rock3d';

import { textureLoader } from './util';

import CEIL5_1 from './asset/CEIL5_1.png';
import FLOOR4_8 from './asset/FLOOR4_8.png';
import STARTAN3 from './asset/STARTAN3.png';

const ATLAS_SIZE = 512;

window.addEventListener("load", async () => {
    // Wait to load all of our textures.
    const textures = await Promise.all([
        textureLoader('CEIL5_1', CEIL5_1),
        textureLoader('FLOOR4_8', FLOOR4_8),
        textureLoader('STARTAN3', STARTAN3)
    ]);

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
    const renderer = new Render.RenderContext(canvas);
    renderer.render(new Camera.Camera());

    // Load our textures into the atlas.
    const atlas = new Atlas.Atlas(ATLAS_SIZE);
    for (let i = 0;i < textures.length;i++) {
        const { name, img } = textures[i];
        atlas.add(name, img);
    }

    // Persist the atlas to the GPU.
    renderer.bakeAtlas(atlas);

    const polygon = [
        vec2.fromValues(-256, 512), // Upper-left corner, going clockwise
        vec2.fromValues(-64, 512),
        vec2.fromValues(64, 512),
        vec2.fromValues(256, 512), // Upper-right corner
        vec2.fromValues(256, 64),
        vec2.fromValues(256, -64), // Lower-right corner
        vec2.fromValues(-256, -64),
        vec2.fromValues(-256, 64),
    ];
    for (let i = 0;i < (polygon.length - 1);i++) {
        renderer.addWall(polygon[i], polygon[i + 1], -64, 64, "STARTAN3");
    }

    const camera = new Camera.Camera();
    camera.pos[0] = 0;
    camera.pos[1] = 448;
    camera.pos[2] = 48;
    camera.yaw = glMatrix.toRadian(0);

    function draw(time: number) {
        renderer.render(camera);
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
});
