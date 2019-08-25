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

import React from 'react';
import ReactDOM from 'react-dom';
import { LevelData } from 'rock3d';

import { Mode, Root } from './tsx/Root';
import { MutLevel } from './mutlevel';

import TESTMAP from './asset/TESTMAP.json';

window.addEventListener("load", async () => {
    const root = document.getElementById('rocked');
    if (root === null) {
        throw new Error('Could not find root element');
    }

    if (!LevelData.isLevelData(TESTMAP)) {
        throw new Error('Map data is not valid');
    }

    const level = new MutLevel(TESTMAP);

    ReactDOM.render(React.createElement(Root, { 
        level: level,
        mode: Mode.DrawView,
    }), root);
});
