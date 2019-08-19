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
import { LevelData } from 'rock3d';
import { glMatrix, vec2, mat2 } from 'gl-matrix';

export interface Props {
    levelData: LevelData.LevelData;
};

interface State {
    levelData: LevelData.LevelData;
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
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx === null) {
            throw new Error('GridView could not initialize canvas');
        }

        // Draw the background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 640, 480);

        this.drawMapData(ctx);
    }

    drawMapData(ctx: CanvasRenderingContext2D ) {
        const trans = mat2.fromValues(0.5, 0, 0, -0.5);
        const off = vec2.fromValues(512, 512);

        ctx.beginPath();
        ctx.strokeStyle = 'white';
        this.state.levelData.polygons.forEach((polygon) => {
            for (let i = 0;i < polygon.sides.length;i++) {
                const side = polygon.sides[i];
                const nextVert = polygon.sides[(i + 1) % polygon.sides.length].vertex;

                if (i === 0) {
                    let x = vec2.create();
                    vec2.transformMat2(x, side.vertex, trans);
                    vec2.add(x, x, off);
                    ctx.moveTo(x[0], x[1]);
                    console.log('first', x);
                }

                let x = vec2.create();
                vec2.transformMat2(x, nextVert, trans);
                vec2.add(x, x, off);
                ctx.lineTo(x[0], x[1]);
                console.log(x);
            }
        });
        ctx.stroke();
    }

    render() {
        return <canvas ref={this.canvas} width={640} height={480}/>;
    }
}
