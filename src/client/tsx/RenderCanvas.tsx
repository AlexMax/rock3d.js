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

import React from "react";

import { Assets } from "../asset";
import { Client, render } from "../client";
import { loadRendererAssets } from "../../r3d/loader";
import { RenderContext } from "../../r3d/render";

export interface Props {
    /**
     * Assets to render with.
     */
    assets: Assets;

    /**
     * Client to render.
     */
    client: Client | null;
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

    componentDidMount(): void {
        const canvas = this.canvas.current;
        if (canvas === null) {
            throw new Error('Canvas is inaccessible');
        }

        // Initialize a view on the given canvas.
        this.renderer = new RenderContext(canvas);
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);

        // Load our assets.
        loadRendererAssets(this.renderer, this.props.assets);

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
