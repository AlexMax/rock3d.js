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

const css = require('../../public/main.css');

import React from 'react';
import ReactDOM from 'react-dom';

import { loadAssets } from './asset';
import { DemoRoot } from './tsx/DemoRoot';

window.addEventListener("load", async () => {
    // Create an element to hold our player.
    const player = document.createElement('div');
    player.id = "player";
    document.body.appendChild(player);

    // Load our assets first.
    const assets = await loadAssets("/asset");

    // Render the demo player.
    ReactDOM.render(React.createElement(DemoRoot, {assets: assets}), player);
});
