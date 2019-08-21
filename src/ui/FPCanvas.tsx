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

/** @jsx jsx */
import { jsx } from '@emotion/core';
import { glMatrix } from 'gl-matrix';
import React from 'react';
import * as rock3d from 'rock3d';

import { textureLoader } from '../util';

import CEIL5_1 from '../asset/CEIL5_1.png';
import FLAT14 from '../asset/FLAT14.png';
import FLAT2 from '../asset/FLAT2.png';
import FLOOR4_8 from '../asset/FLOOR4_8.png';
import RROCK18 from '../asset/RROCK18.png';
import STARTAN3 from '../asset/STARTAN3.png';
import STEP3 from '../asset/STEP3.png';

const ATLAS_SIZE = 512;

export interface Props {
    levelData: rock3d.LevelData.LevelData;
};

export class FPCanvas extends React.Component<Props> {

    canvas: React.RefObject<HTMLCanvasElement>;
    levelData: rock3d.LevelData.LevelData;

    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef();
        this.levelData = props.levelData;
    }

    async componentDidMount() {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('FPView canvas is inaccessible');
        }

        // Initialize a view on the given canvas
        const renderer = new rock3d.r3d.Render.RenderContext(canvas);
        renderer.render(new rock3d.r3d.Camera.Camera());

        // Wait to load all of our textures.
        const textures = await Promise.all([
            textureLoader('CEIL5_1', CEIL5_1),
            textureLoader('FLAT14', FLAT14),
            textureLoader('FLAT2', FLAT2),
            textureLoader('FLOOR4_8', FLOOR4_8),
            textureLoader('RROCK18', RROCK18),
            textureLoader('STARTAN3', STARTAN3),
            textureLoader('STEP3', STEP3),
        ]);

        // Load our textures into the atlas.
        const atlas = new rock3d.Atlas.Atlas(ATLAS_SIZE);
        for (let i = 0;i < textures.length;i++) {
            const { name, img } = textures[i];
            atlas.add(name, img);
        }

        // Persist the atlas to the GPU.
        renderer.bakeAtlas(atlas);

        // Parse our test map data into a map.
        const map = new rock3d.Level.Level(this.levelData);

        // Draw our map
        for (let i = 0;i < map.polygons.length;i++) {
            renderer.addPolygon(map.polygons, i);
        }

        const camera = new rock3d.r3d.Camera.Camera();
        camera.pos[0] = 0;
        camera.pos[1] = 0;
        camera.pos[2] = 48;
        camera.yaw = glMatrix.toRadian(0);

        renderer.render(camera);
    }

    render() {
        return <canvas ref={this.canvas} width={640} height={480}/>;
    }
}
