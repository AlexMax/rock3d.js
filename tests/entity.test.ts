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

import { readFileSync } from 'fs';
import { vec3, quat } from 'gl-matrix';

import { applyVelocity, cloneEntity, Entity } from "../src/entity";
import { createLevel, assertSerializedLevel, Level } from '../src/level';
import { playerConfig, States } from '../src/entityConfig';

let testLevel: Level;

beforeAll(() => {
    // Load the level.
    const mapJSON = readFileSync('asset/map/TESTMAP.json', {
        encoding: "utf8"
    });
    const map = JSON.parse(mapJSON);
    assertSerializedLevel(map);

    testLevel = createLevel(map);
});

describe('applyVelocity', () => {
    test('Running straight into a wall should stop the entity', () => {
        const testEntity: Entity = {
            state: States.spawn,
            stateClock: 0,
            config: playerConfig,
            polygon: 0,
            position: vec3.fromValues(-232, 0, 0),
            rotation: quat.fromEuler(quat.create(), 0, 0, 0),
            velocity: vec3.fromValues(-16, 0, 0),
        };
        const actual = cloneEntity(testEntity);
        applyVelocity(actual, testEntity, testLevel);

        expect(actual.position).toEqualVec3([-240, 0, 0]);
    });

    test('Running into the wall at an angle should slide the entity along it', () => {
        const testEntity: Entity = {
            state: States.spawn,
            stateClock: 0,
            config: playerConfig,
            polygon: 0,
            position: vec3.fromValues(-232, 0, 0),
            rotation: quat.fromEuler(quat.create(), 0, 0, 0),
            velocity: vec3.fromValues(-16, 16, 0),
        };
        const actual = cloneEntity(testEntity);
        applyVelocity(actual, testEntity, testLevel);

        expect(actual.position).toEqualVec3([-240, 16, 0]);
    });

    test('Running into the wall at an angle at high speed should slide the entity along it', () => {
        const position: [number, number, number] = [-232, 0, 0];
        const testEntity: Entity = {
            state: States.spawn,
            stateClock: 0,
            config: playerConfig,
            polygon: 0,
            position: vec3.fromValues(...position),
            rotation: quat.fromEuler(quat.create(), 0, 0, 0),
            velocity: vec3.fromValues(-32, 32, 0),
        };
        const actual = cloneEntity(testEntity);
        applyVelocity(actual, testEntity, testLevel);

        // Shouldn't be stuck.
        expect(actual.position).not.toEqualVec3(position);

        // Should be slid along the wall.
        expect(actual.position[0]).toBeCloseTo(-240);
        expect(actual.position[1]).toBeGreaterThan(0);
    });
});
