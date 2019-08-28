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

import { glMatrix, vec2 } from 'gl-matrix';
import React from 'react';
import * as rock3d from 'rock3d';

import { MutLevel } from '../mutlevel';
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
    /**
     * Level data coming from outside.
     */
    level: MutLevel;
};

interface State {
    /**
     * Position that the canvas is "looking at".
     */
    camera: rock3d.r3d.Camera.Camera;

    /**
     * Current mutated level data we're looking at.
     */
    level: MutLevel;

    /**
     * Current mouse position inside the canvas.
     */
    mousePos: vec2 | null;
}

export class FPCanvas extends React.Component<Props, State> {

    canvas: React.RefObject<HTMLCanvasElement>;
    renderer?: rock3d.r3d.Render.RenderContext;

    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef();
        this.onMouseMove = this.onMouseMove.bind(this);

        this.state = {
            camera: new rock3d.r3d.Camera.Camera(),
            level: props.level, // FIXME: Needs a deep copy.
            mousePos: null,
        }

        this.state.camera.pos[0] = 0;
        this.state.camera.pos[1] = 0;
        this.state.camera.pos[2] = 48;
        this.state.camera.yaw = glMatrix.toRadian(0);
    }

    onMouseMove(event: React.MouseEvent) {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }
        const rect = canvas.getBoundingClientRect();
        this.setState({
            mousePos: vec2.fromValues(event.clientX - rect.left, event.clientY - rect.top)
        });
    }

    async componentDidMount() {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }

        // Initialize a view on the given canvas
        this.renderer = new rock3d.r3d.Render.RenderContext(canvas);

        // Set the canvas internal width and height to the actual width
        // and height of the canvas itself.
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

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
        this.renderer.world.bakeAtlas(atlas);

        // Draw our map
        const level = this.state.level;
        for (let i = 0;i < level.polygons.length;i++) {
            this.renderer.world.addPolygon(level.polygons, i);
        }
        this.renderer.render(this.state.camera);
    }

    shouldComponentUpdate(_: Props, nextState: State): boolean {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }
        if (this.renderer === undefined) {
            throw new Error('Canvas renderer is missing');
        }

        // Possibly resize.
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

        // Draw our map.
        this.renderer.render(this.state.camera);

        return false; // never re-render the DOM node with React
    }

    render() {
        return <canvas className="fp-canvas" ref={this.canvas}
            onMouseMove={this.onMouseMove}/>;
    }
}
