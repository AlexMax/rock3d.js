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

import React from 'react';

import { Atlas } from '../../atlas';
import { Camera } from '../../r3d/camera';
import { EditableLevel } from '../editableLevel';
import { loadAssets } from '../../r3d/loader';
import { RenderContext } from '../../r3d/render';

export interface Props {
    /**
     * Camera that looks at the level.
     */
    camera: Camera;

    /**
     * Level data coming from outside.
     */
    level: EditableLevel;
};

export class FPCanvas extends React.Component<Props> {

    canvas: React.RefObject<HTMLCanvasElement>;
    renderer?: RenderContext;

    constructor(props: Props) {
        super(props);
        this.canvas = React.createRef();
    }

    async componentDidMount() {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }

        // Initialize a view on the given canvas
        this.renderer = new RenderContext(canvas);
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

        // Load all of our textures.
        await loadAssets(this.renderer);

        const perf = performance.now();

        // Figure out what polygons we should draw from this viewpoint.
        const level = this.props.level;
        // const polys = r3d.Camera.visiblePolygons(this.props.camera,
        //     this.renderer.world.worldProject, level);

        // Create our sky.
        this.renderer.world.addSky('sky/SKY1');

        // Draw our map
        for (let i = 0;i < level.polygons.length;i++) {
            this.renderer.world.addPolygon(level, i);
        }

        // Draw all entity sprites.
        /* TODO: Draw locations instead.
        for (let i = 0;i < level.entities.length;i++) {
            this.renderer.world.addEntity(level.entities[i], this.props.camera, level.polygons);
        }
        */

        this.renderer.render(this.props.camera);

        console.log('frame time: ', performance.now() - perf);
    }

    shouldComponentUpdate(nextProps: Props): boolean {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }
        if (this.renderer === undefined) {
            throw new Error('Canvas renderer is missing');
        }

        // Possibly resize.
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

        const perf = performance.now();

        // Recalculate polygon visibility.
        const level = nextProps.level;
        // const polys = r3d.Camera.visiblePolygons(nextProps.camera,
        //     this.renderer.world.worldProject, level);

        // Redraw our map.
        this.renderer.world.clearWorld();
        for (let i = 0;i < level.polygons.length;i++) {
            this.renderer.world.addPolygon(level, i);
        }

        // Redraw all our entities.
        /* TODO: Draw locations instead
        this.renderer.world.clearSprites();
        for (let i = 0;i < level.entities.length;i++) {
            this.renderer.world.addEntity(level.entities[i], nextProps.camera, level.polygons);
        }
        */

        // Draw our map.
        this.renderer.render(nextProps.camera);

        console.log('frame time: ', performance.now() - perf);

        return false; // never re-render the DOM node with React
    }

    render() {
        return <canvas className="mode-canvas" ref={this.canvas}/>;
    }
}
