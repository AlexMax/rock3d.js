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
import { Atlas, r3d } from 'rock3d';

import { MutLevel } from '../mutlevel';
import { textureLoader } from '../util';

import CEIL5_1 from '../asset/CEIL5_1.png';
import FLAT14 from '../asset/FLAT14.png';
import FLAT2 from '../asset/FLAT2.png';
import FLOOR4_8 from '../asset/FLOOR4_8.png';
import RROCK18 from '../asset/RROCK18.png';
import STARTAN3 from '../asset/STARTAN3.png';
import STEP3 from '../asset/STEP3.png';

import PLAYA1 from '../asset/PLAYA1.png';
import PLAYA2A8 from '../asset/PLAYA2A8.png';
import PLAYA3A7 from '../asset/PLAYA3A7.png';
import PLAYA4A6 from '../asset/PLAYA4A6.png';
import PLAYA5 from '../asset/PLAYA5.png';

const ATLAS_SIZE = 512;

export interface Props {
    /**
     * Camera that looks at the level.
     */
    camera: r3d.Camera.Camera;

    /**
     * Level data coming from outside.
     */
    level: MutLevel;
};

export class FPCanvas extends React.Component<Props> {

    canvas: React.RefObject<HTMLCanvasElement>;
    renderer?: r3d.Render.RenderContext;

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
        this.renderer = new r3d.Render.RenderContext(canvas);
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
        const texAtlas = new Atlas.Atlas(ATLAS_SIZE);
        for (let i = 0;i < textures.length;i++) {
            const { name, img } = textures[i];
            texAtlas.add(name, img);
        }

        // Persist the atlas to the GPU.
        this.renderer.world.bakeTextureAtlas(texAtlas);

        // Wait to load all of our sprites.
        const sprites = await Promise.all([
            textureLoader('PLAYA1', PLAYA1),
            textureLoader('PLAYA2A8', PLAYA2A8),
            textureLoader('PLAYA3A7', PLAYA3A7),
            textureLoader('PLAYA4A6', PLAYA4A6),
            textureLoader('PLAYA5', PLAYA5),
        ]);

        // Load our textures into the atlas.
        const spriteAtlas = new Atlas.Atlas(ATLAS_SIZE);
        for (let i = 0;i < sprites.length;i++) {
            const { name, img } = sprites[i];
            spriteAtlas.add(name, img);
        }

        // Persist the atlas to the GPU.
        this.renderer.sprite.bakeSpriteAtlas(spriteAtlas);

        // Draw our map
        const level = this.props.level;
        for (let i = 0;i < level.polygons.length;i++) {
            this.renderer.world.addPolygon(level.polygons, i);
        }

        // Draw all entities.
        for (let i = 0;i < level.entities.length;i++) {
            this.renderer.world.addEntity(level.entities, i);
        }

        this.renderer.render(this.props.camera);
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

        // Draw our map.
        this.renderer.render(nextProps.camera);

        return false; // never re-render the DOM node with React
    }

    render() {
        return <canvas className="mode-canvas" ref={this.canvas}/>;
    }
}
