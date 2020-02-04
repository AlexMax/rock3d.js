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

const benchmark = require('benchmark');

const { getAnimationFrame } = require('./dist/entityConfig');

/**
 * A test entity.
 */
const testConfig = {
    name: "Test",
    radius: 16,
    height: 32,
    spritePrefix: 'TEST',
    grounded: true,
    animations: {
        spawn: {
            frames: [{
                frame: 'ABC',
                time: 62.5,
            }, {
                frame: 'DE',
                time: 125,
            }]
        },
        walk: {
            loop: true,
            frames: [{
                frame: 'ABC',
                time: 125,
            }]
        }
    }
}

const period = 1000 / 32;

const suite = new benchmark.Suite(); 

suite.add("getAnimationFrame", function() {
    const frame = getAnimationFrame(
        testConfig, 'walk', 1, 24, period
    );
}).on('cycle', function(ev) {
    console.log(String(ev.target));
}).run();
