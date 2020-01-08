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

import React from 'react';
import ReactDOM from 'react-dom';

import { Root } from './tsx/Root';
import { loadAssets } from '../client/asset';

window.addEventListener("load", async () => {
    // Create an element to hold our editor.
    const editor = document.createElement('div');
    editor.id = "editor";
    document.body.appendChild(editor);

    // Load our assets first.
    const assets = await loadAssets("/asset");

    // Render the editor.
    ReactDOM.render(React.createElement(Root, { assets: assets }), editor);
});
