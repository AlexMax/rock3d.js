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

import React from "react";

import { render } from "../client";
import { DemoClient } from "../demo";
import { loadAssets } from "../../r3d/loader";
import { RenderContext } from "../../r3d/render";

export interface Props {
    /**
     * Client to render.
     */
    client: DemoClient | null;
}

export class RenderCanvas extends React.Component<Props> {

    canvas: React.RefObject<HTMLCanvasElement>;
    renderer?: RenderContext;
    timer?: number;

    constructor(props: Readonly<Props>) {
        super(props);

        this.draw = this.draw.bind(this);

        this.canvas = React.createRef();
    }

    async componentDidMount(): Promise<void> {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }

        // Initialize a view on the given canvas.
        this.renderer = new RenderContext(canvas);
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

        // Load our assets.
        await loadAssets(this.renderer);

        // Start the rendering loop.
        this.timer = window.requestAnimationFrame(this.draw);
    }

    componentWillUnmount(): void {
        if (typeof this.timer === 'number') {
            cancelAnimationFrame(this.timer);
        }
    }

    shouldComponentUpdate(): boolean {
        // We have a canvas, never update ourselves.
        return false;
    }

    private draw(): void {
        if (this.props.client !== null && this.renderer !== undefined) {
            render(this.props.client, this.renderer);
        }
        this.timer = window.requestAnimationFrame(this.draw);
    }

    render(): JSX.Element {
        return <canvas width={640} height={480} ref={this.canvas}/>;
    }
}
