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