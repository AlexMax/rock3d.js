/*
 * rock3d.js: A 3D game engine for making retro FPS games
 * Copyright (C) 2018 Alex Mayfield <alexmax2742@gmail.com>
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
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
