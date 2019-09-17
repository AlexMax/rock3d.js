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

import {
    Camera, create as cameraCreate, pan as cameraPan, zoom as cameraZoom
} from '../../r2d/camera';
import { DrawInput } from './DrawInput';
import { MutLevel } from '../mutlevel';
import { StatusBar } from './ui/StatusBar';
import { Toolbar } from './ui/Toolbar';
import { TopdownCanvas } from './TopdownCanvas';
import { mround } from '../util';

export interface Props {
    level: MutLevel;
};

interface State {
    /**
     * Current camera position.
     */
    camera: Camera;

    /**
     * Lines that we are using for a draw command.
     */
    drawLines: vec2[];

    /**
     * Current grid size.
     */
    gridSize: number;

    /**
     * Current position of mouse in level.
     */
    levelPos: vec2 | null;
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
        this.gridIn = this.gridIn.bind(this);
        this.gridOut = this.gridOut.bind(this);
        this.levelPos = this.levelPos.bind(this);
        this.levelClick = this.levelClick.bind(this);

        this.state = {
            camera: cameraCreate(),
            drawLines: [],
            gridSize: 32,
            levelPos: null,
        }
    }

    panUp() {
        this.setState({ camera: cameraPan(this.state.camera, 0, 64) });
    }

    panDown() {
        this.setState({ camera: cameraPan(this.state.camera, 0, -64) });
    }

    panLeft() {
        this.setState({ camera: cameraPan(this.state.camera, -64, 0) });
    }

    panRight() {
        this.setState({ camera: cameraPan(this.state.camera, 64, 0) });
    }

    zoomIn() {
        this.setState({ camera: cameraZoom(this.state.camera, 2) });
    }

    zoomOut() {
        this.setState({ camera: cameraZoom(this.state.camera, 0.5) });
    }

    gridIn() {
        const gridSize = Math.max(1, this.state.gridSize * 0.5);
        this.setState({ gridSize: gridSize });
    }

    gridOut() {
        const gridSize = Math.min(1024, this.state.gridSize * 2);
        this.setState({ gridSize: gridSize });
    }

    levelPos(levelPos: vec2 | null) {
        if (levelPos !== null) {
            this.setState({ levelPos: vec2.fromValues(levelPos[0], levelPos[1]) });

            // Moving the mouse also adjusts our drawling line, if it exists.
            if (this.state.drawLines.length > 0) {
                const snapped = vec2.fromValues(
                    mround(levelPos[0], this.state.gridSize),
                    mround(levelPos[1], this.state.gridSize));
                const newLines = this.state.drawLines.slice(0);
                newLines[newLines.length - 1] = snapped;
                this.setState({ drawLines: newLines });
            }
        } else {
            this.setState({ levelPos: null });
        }
    }

    levelClick(levelPos: vec2) {
        // Snap to grid.
        const snapped = vec2.fromValues(
            mround(levelPos[0], this.state.gridSize),
            mround(levelPos[1], this.state.gridSize));
    
        const drawLines = [...this.state.drawLines, snapped];
        this.setState({ drawLines: drawLines });
    }

    render(): JSX.Element {
        const posX = (this.state.levelPos !== null) ? this.state.levelPos[0].toFixed(0) : '-';
        const posY = (this.state.levelPos !== null) ? this.state.levelPos[1].toFixed(0) : '-';

        return <>
            <TopdownCanvas camera={this.state.camera} drawLines={this.state.drawLines}
                gridSize={this.state.gridSize} level={this.props.level}
                onLevelPos={this.levelPos} onLevelClick={this.levelClick}/>
            <StatusBar>
                <div className="status-bar-push">Grid Size: {this.state.gridSize}</div>
                <div>Coords: {posX}, {posY}</div>
            </StatusBar>
            <Toolbar title="A Test Toolbar"/>
            <DrawInput panUp={this.panUp} panDown={this.panDown}
                panLeft={this.panLeft} panRight={this.panRight}
                zoomIn={this.zoomIn} zoomOut={this.zoomOut}
                gridIn={this.gridIn} gridOut={this.gridOut}/>
        </>;
    }
};
