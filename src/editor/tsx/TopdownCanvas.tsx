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

import { Camera } from '../../r2d/camera';
import { MutLevel } from '../mutlevel';
import { RenderContext } from '../../r2d/render';

export interface Props {
    /**
     * Camera that looks at level data.
     */
    camera: Camera;

    /**
     * Extra lines that are currently being drawn.
     */
    drawLines: vec2[];

    /**
     * Grid resolution.
     */
    gridSize: number;

    /**
     * Level data.
     */
    level: MutLevel;

    /**
     * Called when we detect a new mouse position in the level.
     */
    onLevelPos: (mousePos: vec2 | null) => void;

    /**
     * Called when we detect a mouse click in the level.
     */
    onLevelClick: (mousePos: vec2) => void;
};

const styles = {
    drawLines: 'rgb(255, 172, 0)',
    vertexes: 'rgb(81, 168, 255)',
};

export class TopdownCanvas extends React.Component<Props> {

    canvas: React.RefObject<HTMLCanvasElement>;
    renderer?: RenderContext;

    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef();
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    onMouseMove(event: React.MouseEvent) {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('GridView canvas is inaccessible');
        }
        const rect = canvas.getBoundingClientRect();
        const mousePos = vec2.fromValues(event.clientX - rect.left, event.clientY - rect.top);

        // Send our level coordinates to parent callback.
        if (this.renderer === undefined) {
            throw new Error('Renderer is missing');
        }
        const coord = vec2.create();
        this.renderer.screenToWorld(coord, mousePos, this.props.camera);
        this.props.onLevelPos(coord);
    }

    onClick(event: React.MouseEvent) {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('GridView canvas is inaccessible');
        }
        const rect = canvas.getBoundingClientRect();
        const mousePos = vec2.fromValues(event.clientX - rect.left, event.clientY - rect.top);

        // Send our level click event to parent callback.
        if (this.renderer === undefined) {
            throw new Error('Renderer is missing');
        }
        const coord = vec2.create();
        this.renderer.screenToWorld(coord, mousePos, this.props.camera);
        this.props.onLevelClick(coord);
    }

    componentDidMount() {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }

        // Initialize a new renderer.
        this.renderer = new RenderContext(canvas);
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

        // Render our initial view.
        this.renderer.clear();
        this.renderer.renderGrid(this.props.camera, this.props.gridSize);
        this.renderer.renderLevel(this.props.level, this.props.camera);
        this.renderer.renderVertexes(this.props.level.vertexCache.toArray(), this.props.camera, styles.vertexes);

        this.renderer.renderLines(this.props.drawLines, this.props.camera, styles.drawLines);
        this.renderer.renderVertexes(this.props.drawLines, this.props.camera, styles.drawLines);
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
        this.renderer.renderVertexes(nextProps.level.vertexCache.toArray(), nextProps.camera, styles.vertexes);

        this.renderer.renderLines(nextProps.drawLines, nextProps.camera, styles.drawLines);
        this.renderer.renderVertexes(nextProps.drawLines, nextProps.camera, styles.drawLines);

        return false; // never re-render the DOM node with React
    }

    render() {
        return <canvas className="mode-canvas" ref={this.canvas}
            onMouseMove={this.onMouseMove} onClick={this.onClick}/>;
    }
}
