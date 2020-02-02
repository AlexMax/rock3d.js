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

import { readFileSync } from 'fs';
import { vec3, quat } from 'gl-matrix';

import { applyVelocity, cloneEntity, Entity } from "../src/entity";
import { createLevel, assertSerializedLevel, Level } from '../src/level';
import { playerConfig } from '../src/entityConfig';

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
            state: "spawn",
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
            state: "spawn",
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
            state: "spawn",
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