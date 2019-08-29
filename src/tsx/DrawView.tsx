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

import { DrawInput } from './DrawInput';
import { MutLevel } from '../mutlevel';
import { StatusBar } from './ui/StatusBar';
import { Toolbar } from './ui/Toolbar';
import { TopdownCanvas } from './TopdownCanvas';

export interface Props {
    level: MutLevel;
};

interface State {
    camera: r2d.Camera.Camera;
    mousePos: vec2 | null;
}

export class DrawView extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
        super(props);
        this.panUp = this.panUp.bind(this);
        this.panDown = this.panDown.bind(this);
        this.panLeft = this.panLeft.bind(this);
        this.panRight = this.panRight.bind(this);
        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.newMousePos = this.newMousePos.bind(this);

        this.state = {
            camera: r2d.Camera.create(),
            mousePos: null,
        }
    }

    panUp() {
        this.setState({ camera: r2d.Camera.pan(this.state.camera, 0, 64) });
    }

    panDown() {
        this.setState({ camera: r2d.Camera.pan(this.state.camera, 0, -64) });
    }

    panLeft() {
        this.setState({ camera: r2d.Camera.pan(this.state.camera, -64, 0) });
    }

    panRight() {
        this.setState({ camera: r2d.Camera.pan(this.state.camera, 64, 0) });
    }

    zoomIn() {
        this.setState({ camera: r2d.Camera.zoom(this.state.camera, 2) });
    }

    zoomOut() {
        this.setState({ camera: r2d.Camera.zoom(this.state.camera, 0.5) });
    }

    newMousePos(mousePos: vec2 | null) {
        if (mousePos !== null) {
            this.setState({ mousePos: vec2.fromValues(mousePos[0], mousePos[1]) });
        } else {
            this.setState({ mousePos: null });
        }
    }

    render(): JSX.Element {
        const posX = (this.state.mousePos !== null) ? this.state.mousePos[0].toFixed(0) : '-';
        const posY = (this.state.mousePos !== null) ? this.state.mousePos[1].toFixed(0) : '-';

        return <>
            <TopdownCanvas camera={this.state.camera} level={this.props.level}
                onNewMousePos={this.newMousePos}/>
            <StatusBar>
                <div>{posX}, {posY}</div>
            </StatusBar>
            <Toolbar title="A Test Toolbar"/>
            <DrawInput panUp={this.panUp} panDown={this.panDown}
                panLeft={this.panLeft} panRight={this.panRight}
                zoomIn={this.zoomIn} zoomOut={this.zoomOut}/>
        </>;
    }
};
