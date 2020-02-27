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

import {
    EntityConfig, getAnimationFrame, States
} from '../src/entityConfig';

/**
 * A test entity.
 */
export const testConfig: EntityConfig = {
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

describe('getAnimationFrame', () => {
    test('Endless animation should progress properly', () => {
        // Should last 2 frames.
        expect(getAnimationFrame(
            testConfig, States.spawn, 1, 1, period
        )).toEqual('A');
        expect(getAnimationFrame(
            testConfig, States.spawn, 1, 2, period
        )).toEqual('A');

        // Should switch to the next frame.
        expect(getAnimationFrame(
            testConfig, States.spawn, 1, 3, period
        )).toEqual('B');

        // Checking the last frame of the first group.
        expect(getAnimationFrame(
            testConfig, States.spawn, 1, 6, period
        )).toEqual('C');

        // Checking the first frame of the last group, which lasts 4 frames.
        expect(getAnimationFrame(
            testConfig, States.spawn, 1, 7, period
        )).toEqual('D');
        expect(getAnimationFrame(
            testConfig, States.spawn, 1, 10, period
        )).toEqual('D');

        // Checking the last frame of the last group, which lasts forever.
        expect(getAnimationFrame(
            testConfig, States.spawn, 1, 11, period
        )).toEqual('E');
        expect(getAnimationFrame(
            testConfig, States.spawn, 1, 111, period
        )).toEqual('E');
    });
    test('Looping animation should progress properly', () => {
        // Should last 4 frames.
        expect(getAnimationFrame(
            testConfig, States.walk, 1, 1, period
        )).toEqual('A');
        expect(getAnimationFrame(
            testConfig, States.walk, 1, 4, period
        )).toEqual('A');

        // Should switch to the next frame.
        expect(getAnimationFrame(
            testConfig, States.walk, 1, 5, period
        )).toEqual('B');

        // Checking the last tic of the last frame.
        expect(getAnimationFrame(
            testConfig, States.walk, 1, 12, period
        )).toEqual('C');

        // Check if looping behaves properly.
        expect(getAnimationFrame(
            testConfig, States.walk, 1, 13, period
        )).toEqual('A');
        expect(getAnimationFrame(
            testConfig, States.walk, 1, 24, period
        )).toEqual('C');
    });
});
