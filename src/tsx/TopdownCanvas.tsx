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
import { r2d } from 'rock3d';

import { MutLevel } from '../mutlevel';

export interface Props {
    /**
     * Camera that looks at level data.
     */
    camera: r2d.Camera.Camera;

    /**
     * Grid resolution.
     */
    gridSize: number;

    /**
     * Level data.
     */
    level: MutLevel;

    /**
     * Called when we set the mouse position.
     */
    onNewMousePos: (mousePos: vec2 | null) => void;
};

interface State {
    /**
     * Current mouse position inside the canvas.
     */
    mousePos: vec2 | null;
}

export class TopdownCanvas extends React.Component<Props, State> {

    canvas: React.RefObject<HTMLCanvasElement>;
    renderer?: r2d.Render.RenderContext;

    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef();
        this.onMouseMove = this.onMouseMove.bind(this);

        this.state = {
            mousePos: null,
        };
    }

    onMouseMove(event: React.MouseEvent) {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('GridView canvas is inaccessible');
        }
        const rect = canvas.getBoundingClientRect();
        const mousePos = vec2.fromValues(event.clientX - rect.left, event.clientY - rect.top);

        this.setState({
            mousePos: mousePos,
        });

        // Send our mouse coordinates elsewhere.
        if (this.renderer === undefined) {
            throw new Error('Renderer is missing');
        }
        const coord = vec2.create();
        this.renderer.screenToWorld(coord, mousePos, this.props.camera);
        this.props.onNewMousePos(coord);
    }

    componentDidMount() {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }

        // Initialize a new renderer.
        this.renderer = new r2d.Render.RenderContext(canvas);
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

        // Render our initial view.
        this.renderer.clear();
        this.renderer.renderGrid(this.props.camera, this.props.gridSize);
        this.renderer.renderLevel(this.props.level, this.props.camera);
        this.renderer.renderVertexes(this.props.level.vertexCache.toArray(), this.props.camera);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        if (this.renderer === undefined) {
            throw new Error('Renderer is missing');
        }

        // Our view might have resized, Handle it.
        const ctx = this.renderer.ctx;
        this.renderer.resize(ctx.canvas.clientWidth, ctx.canvas.clientHeight);

        // Render.
        this.renderer.clear();
        this.renderer.renderGrid(nextProps.camera, nextProps.gridSize);
        this.renderer.renderLevel(nextProps.level, nextProps.camera);
        this.renderer.renderVertexes(nextProps.level.vertexCache.toArray(), nextProps.camera);

        return false; // never re-render the DOM node with React
    }

    render() {
        return <canvas className="mode-canvas" ref={this.canvas}
            onMouseMove={this.onMouseMove}/>;
    }
}
