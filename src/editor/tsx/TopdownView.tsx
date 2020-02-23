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
import { vec2 } from "gl-matrix";

import { TopdownInput } from "./TopdownInput";
import { Mode } from "./EditorRoot";
import { LocationInspectMode } from "./LocationInspectMode";
import { cameraCreate, cameraPan, cameraZoom, Camera } from "../../r2d/camera";
import { EditableLevel } from "../editableLevel";

interface Props {
    /**
     * Currently selected mode.
     */
    mode: Mode;

    /**
     * Level data.
     */
    level: EditableLevel;
}

interface State {
    /**
     * Current camera position.
     */
    camera: Camera;

    /**
     * Current grid size.
     */
    gridSize: number;

    /**
     * Current position of mouse in level.
     */
    levelPos: vec2 | null;
}

export class TopdownView extends React.Component<Props, State> {

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

        this.state = {
            camera: cameraCreate(),
            gridSize: 32,
            levelPos: null,
        }
    }

    panUp(): void {
        this.setState({ camera: cameraPan(this.state.camera, 0, 64) });
    }

    panDown(): void {
        this.setState({ camera: cameraPan(this.state.camera, 0, -64) });
    }

    panLeft(): void {
        this.setState({ camera: cameraPan(this.state.camera, -64, 0) });
    }

    panRight(): void {
        this.setState({ camera: cameraPan(this.state.camera, 64, 0) });
    }

    zoomIn(): void {
        this.setState({ camera: cameraZoom(this.state.camera, 2) });
    }

    zoomOut(): void {
        this.setState({ camera: cameraZoom(this.state.camera, 0.5) });
    }

    gridIn(): void {
        const gridSize = Math.max(1, this.state.gridSize * 0.5);
        this.setState({ gridSize: gridSize });
    }

    gridOut(): void {
        const gridSize = Math.min(1024, this.state.gridSize * 2);
        this.setState({ gridSize: gridSize });
    }

    render() {
        let mode: JSX.Element | null = null;
        switch (this.props.mode) {
        case Mode.LocationInspect:
            mode = <LocationInspectMode
                camera={this.state.camera}
                gridSize={this.state.gridSize}
                level={this.props.level} />;
            break;
        default:
            break;
        }

        return <>
            {mode}
            <TopdownInput
                panUp={this.panUp} panDown={this.panDown} panLeft={this.panLeft}
                panRight={this.panRight} zoomIn={this.zoomIn} zoomOut={this.zoomOut}
                gridIn={this.gridIn} gridOut={this.gridOut}/>
        </>;
    }
}