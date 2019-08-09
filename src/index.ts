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

window.addEventListener("load", () => {
    // Create canvas
    const root = document.getElementById('rocked');
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    root.appendChild(canvas);

    // Initialize a view on the given canvas
    const renderer = new rock3d.Render.RenderContext(canvas);
    renderer.render(new rock3d.Camera.Camera());
});
