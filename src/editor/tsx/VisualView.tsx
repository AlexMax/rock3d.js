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

import { Assets } from '../../client/asset';
import {
    Camera, createCamera, moveRelative as cameraMoveRelative,
    rotateEuler as cameraRotateEuler
} from '../../r3d/camera';
import { FPCanvas } from './FPCanvas';
import { EditableLevel } from '../editableLevel';
import { StatusBar } from '../../tsx/StatusBar';
import { VisualInput } from './VisualInput';

export interface Props {
    /**
     * Static assets.
     */
    assets: Assets;

    /**
     * Level data.
     */
    level: EditableLevel;
};

export interface State {
    /**
     * Current camera position.
     */
    camera: Camera;
}

export class VisualView extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
        super(props);
        this.moveForward = this.moveForward.bind(this);
        this.moveBackward = this.moveBackward.bind(this);
        this.strafeLeft = this.strafeLeft.bind(this);
        this.strafeRight = this.strafeRight.bind(this);
        this.floatUp = this.floatUp.bind(this);
        this.floatDown = this.floatDown.bind(this);
        this.rollCW = this.rollCW.bind(this);
        this.rollCCW = this.rollCCW.bind(this);
        this.pitchUp = this.pitchUp.bind(this);
        this.pitchDown = this.pitchDown.bind(this);
        this.yawLeft = this.yawLeft.bind(this);
        this.yawRight = this.yawRight.bind(this);

        let camera = createCamera(0, 0, 48);
        this.state = {
            camera: camera,
        };
    }

    moveForward() {
        this.setState({ camera: cameraMoveRelative(
            this.state.camera, 64, 0, 0
        )});
    }

    moveBackward() {
        this.setState({ camera: cameraMoveRelative(
            this.state.camera, -64, 0, 0
        )});
    }

    strafeLeft() {
        this.setState({ camera: cameraMoveRelative(
            this.state.camera, 0, 64, 0
        )});
    }

    strafeRight() {
        this.setState({ camera: cameraMoveRelative(
            this.state.camera, 0, -64, 0
        )});
    }

    floatUp() {
        this.setState({ camera: cameraMoveRelative(
            this.state.camera, 0, 0, 64
        )});
    }

    floatDown() {
        this.setState({ camera: cameraMoveRelative(
            this.state.camera, 0, 0, -64
        )});
    }

    rollCW() {
        this.setState({ camera: cameraRotateEuler(
            this.state.camera, 15, 0, 0
        )});
    }

    rollCCW() {
        this.setState({ camera: cameraRotateEuler(
            this.state.camera, -15, 0, 0
        )});
    }

    pitchDown() {
        this.setState({ camera: cameraRotateEuler(
            this.state.camera, 0, 15, 0
        )});
    }

    pitchUp() {
        this.setState({ camera: cameraRotateEuler(
            this.state.camera, 0, -15, 0
        )});
    }

    yawLeft() {
        this.setState({ camera: cameraRotateEuler(
            this.state.camera, 0, 0, 15
        )});
    }

    yawRight() {
        this.setState({ camera: cameraRotateEuler(
            this.state.camera, 0, 0, -15
        )});
    }

    render(): JSX.Element {
        return <>
            <FPCanvas
                assets={this.props.assets} camera={this.state.camera}
                level={this.props.level}/>
            <StatusBar/>
            <VisualInput moveForward={this.moveForward} moveBackward={this.moveBackward}
                strafeLeft={this.strafeLeft} strafeRight={this.strafeRight}
                floatUp={this.floatUp} floatDown={this.floatDown}
                rollCW={this.rollCW} rollCCW={this.rollCCW}
                pitchUp={this.pitchUp} pitchDown={this.pitchDown}
                yawLeft={this.yawLeft} yawRight={this.yawRight}/>
        </>;
    }
};
