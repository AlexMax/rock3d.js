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

import React from 'react';

import { Camera } from '../../r3d/camera';
import { EditableLevel } from '../editableLevel';
import { loadRendererAssets } from '../../r3d/loader';
import { RenderContext } from '../../r3d/render';
import { Assets } from '../../client/asset';

export interface Props {
    /**
     * Static assets for level.
     */
    assets: Assets;

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
        loadRendererAssets(this.renderer, this.props.assets);

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
