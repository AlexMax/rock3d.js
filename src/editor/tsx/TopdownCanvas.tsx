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

import { vec2 } from 'gl-matrix';
import React from 'react';

import { Camera } from '../../r2d/camera';
import { EditableLevel } from '../editableLevel';
import { RenderContext } from '../../r2d/render';

export interface Props {
    /**
     * Camera that looks at level data.
     */
    camera: Camera;

    /**
     * Extra lines that are currently being drawn.
     */
    //drawLines: vec2[];

    /**
     * Grid resolution.
     */
    gridSize: number;

    /**
     * Level data.
     */
    level: EditableLevel;

    /**
     * Currently highlighted location.
     * 
     * Null and undefined are treated the same.  Null tends to be used when
     * the mode normally highlights a location, just not any location
     * at this particular moment.  Undefined on the other hand is used when
     * the mode doesn't bother with locations at all.
     */
    highlightedLocation?: number | null;

    /**
     * Currently selected locations.
     */
    selectedLocations?: number[];

    /**
     * Called when we detect a new mouse position in the level.
     */
    onLevelPos: ((mousePos: vec2 | null) => void) | null;

    /**
     * Called when we detect a mouse click in the level.
     */
    onLevelClick: ((mousePos: vec2) => void) | null;
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
        if (this.props.onLevelPos !== null) {
            this.props.onLevelPos(coord);
        }
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
        if (this.props.onLevelClick !== null) {
            this.props.onLevelClick(coord);
        }
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
        this.renderer.renderLocations(
            this.props.level, this.props.camera, this.props.highlightedLocation
        );

        //this.renderer.renderLines(this.props.drawLines, this.props.camera, styles.drawLines);
        //this.renderer.renderVertexes(this.props.drawLines, this.props.camera, styles.drawLines);
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
        this.renderer.renderLocations(
            nextProps.level, nextProps.camera, nextProps.highlightedLocation
        );

        //this.renderer.renderLines(nextProps.drawLines, nextProps.camera, styles.drawLines);
        //this.renderer.renderVertexes(nextProps.drawLines, nextProps.camera, styles.drawLines);

        return false; // never re-render the DOM node with React
    }

    render() {
        return <canvas className="mode-canvas" ref={this.canvas}
            onMouseMove={this.onMouseMove} onClick={this.onClick}/>;
    }
}
