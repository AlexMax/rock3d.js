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

import { vec2, mat3 } from 'gl-matrix';
import React from 'react';
import * as rock3d from 'rock3d';
import { Camera } from 'rock3d/dist/r3d';

export interface Props {
    levelData: rock3d.LevelData.LevelData;
};

interface State {
    levelData: rock3d.LevelData.LevelData;
}

export class GridView extends React.Component<Props, State> {

    canvas: React.RefObject<HTMLCanvasElement>;

    constructor(props: Props) {
        super(props);

        this.canvas = React.createRef();
        this.state = {
            levelData: props.levelData // FIXME: Needs a deep copy.
        };
    }

    componentDidMount() {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('GridView canvas is inaccessible');
        }

        // Initialize a view on the given canvas
        const camera = new rock3d.r2d.Camera.Camera();

        const renderer = new rock3d.r2d.Render.RenderContext(canvas);
        renderer.renderLevel(this.state.levelData, camera);
    }

    render() {
        return <canvas ref={this.canvas} width={640} height={480}/>;
    }
}
