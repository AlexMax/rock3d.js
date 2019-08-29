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
     * Level data.
     */
    level: MutLevel;
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
        this.setState({
            mousePos: vec2.fromValues(event.clientX - rect.left, event.clientY - rect.top)
        });
    }

    componentDidMount() {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('GridView canvas is inaccessible');
        }

        // Initialize a new renderer.
        this.renderer = new r2d.Render.RenderContext(canvas);
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

        // Render our initial view.
        this.renderer.clear();
        this.renderer.renderGrid(this.props.camera);
        this.renderer.renderLevel(this.props.level, this.props.camera);
        this.renderer.renderVertexes(this.props.level.vertexCache.toArray(), this.props.camera);
    }

    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        if (this.renderer === undefined) {
            throw new Error('GridView renderer is missing');
        }

        // Our view might have resized, Handle it.
        const ctx = this.renderer.ctx;
        this.renderer.resize(ctx.canvas.clientWidth, ctx.canvas.clientHeight);

        // Render.
        this.renderer.clear();
        this.renderer.renderGrid(nextProps.camera);
        this.renderer.renderLevel(nextProps.level, nextProps.camera);
        this.renderer.renderVertexes(nextProps.level.vertexCache.toArray(), nextProps.camera);

        if (nextState.mousePos === null) {
            return false; // We don't have mouse data
        }

        // DEBUG: World coordinates
        const coord = vec2.create();
        this.renderer.screenToWorld(coord, nextState.mousePos, nextProps.camera);
        this.renderer.ctx.strokeText(`x: ${coord[0]} y: ${coord[1]}`, 0, this.renderer.ctx.canvas.clientHeight);

        return false; // never re-render the DOM node with React
    }

    render() {
        return <canvas className="topdown-canvas" ref={this.canvas}
            onMouseMove={this.onMouseMove}/>;
    }
}
