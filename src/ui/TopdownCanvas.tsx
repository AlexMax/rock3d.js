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

import { vec2 } from 'gl-matrix';
import React from 'react';
import * as rock3d from 'rock3d';

export interface Props {
    /**
     * Level data coming from outside.
     */
    levelData: rock3d.LevelData.LevelData;
};

interface State {
    /**
     * Position that the canvas is "looking at".
     */
    camera: rock3d.r2d.Camera.Camera;

    /**
     * Current mutated level data we're looking at.
     */
    levelData: rock3d.LevelData.LevelData;

    /**
     * Current mouse position inside the canvas.
     */
    mousePos: vec2 | null;

    /**
     * Cache of vertexes and their associated polygons.
     */
    vertexCache: rock3d.LevelData.VertexCache;
}

export class TopdownCanvas extends React.Component<Props, State> {

    canvas: React.RefObject<HTMLCanvasElement>;
    renderer?: rock3d.r2d.Render.RenderContext;

    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef();
        this.onMouseMove = this.onMouseMove.bind(this);

        this.state = {
            camera: new rock3d.r2d.Camera.Camera(),
            levelData: props.levelData, // FIXME: Needs a deep copy.
            mousePos: null,
            vertexCache: rock3d.LevelData.toSharedVertexCache(props.levelData.polygons),
        };
    }

    onMouseMove(event: React.MouseEvent) {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('GridView canvas is inaccessible');
        }
        const rect = canvas.getBoundingClientRect();
        this.setState({
            mousePos: vec2.fromValues(event.clientX - rect.left, event.clientY - rect.top)
        });
    }

    componentDidMount() {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('GridView canvas is inaccessible');
        }

        this.renderer = new rock3d.r2d.Render.RenderContext(canvas);
        this.renderer.clear();
        this.renderer.renderGrid(this.state.camera);
        this.renderer.renderLevel(this.state.levelData, this.state.camera);
        this.renderer.renderVertexCache(this.state.vertexCache, this.state.camera);
    }

    shouldComponentUpdate(_: Props, nextState: State): boolean {
        if (this.renderer === undefined) {
            throw new Error('GridView renderer is missing');
        }

        this.renderer.clear();
        this.renderer.renderGrid(nextState.camera);
        this.renderer.renderLevel(nextState.levelData, nextState.camera);
        this.renderer.renderVertexCache(nextState.vertexCache, nextState.camera);

        if (nextState.mousePos === null) {
            return false; // We don't have mouse data
        }

        // DEBUG: World coordinates
        const coord = vec2.create();
        this.renderer.screenToWorld(coord, nextState.mousePos, nextState.camera);
        this.renderer.ctx.strokeText(`x: ${coord[0]} y: ${coord[1]}`, 0, this.renderer.ctx.canvas.clientHeight);

        return false; // never re-render the DOM node with React
    }

    render() {
        return <canvas ref={this.canvas} width={800} height={600}
            onMouseMove={this.onMouseMove}/>;
    }
}
