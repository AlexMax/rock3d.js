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

        // Checking the last frame of the lasts group, which lasts forever.
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
