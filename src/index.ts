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
import { Atlas, Map, MapData, Render, Camera } from 'rock3d';

import { textureLoader } from './util';

import CEIL5_1 from './asset/CEIL5_1.png';
import FLOOR4_8 from './asset/FLOOR4_8.png';
import STARTAN3 from './asset/STARTAN3.png';
import STEP3 from './asset/STEP3.png';
import TESTMAP from './asset/TESTMAP.json';

const ATLAS_SIZE = 512;

window.addEventListener("load", async () => {
    // Debugging stuff
    (window as any).getVertex = Render.getVertex;

    // Wait to load all of our textures.
    const textures = await Promise.all([
        textureLoader('CEIL5_1', CEIL5_1),
        textureLoader('FLOOR4_8', FLOOR4_8),
        textureLoader('STARTAN3', STARTAN3),
        textureLoader('STEP3', STEP3),
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

    // Parse our test map data into a map.
    if (!MapData.isMapData(TESTMAP)) {
        throw new Error('Map data is not valid');
    }
    const map = new Map.Map(TESTMAP);

    // Draw our map
    for (let i = 0;i < map.polygons.length;i++) {
        renderer.addPolygon(map.polygons, i);
    }

    const camera = new Camera.Camera();
    camera.pos[0] = 0;
    camera.pos[1] = 0;
    camera.pos[2] = 48;
    camera.yaw = glMatrix.toRadian(0);

    function draw(time: number) {
        renderer.render(camera);
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
});
