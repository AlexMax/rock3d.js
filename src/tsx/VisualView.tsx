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
import { r3d } from 'rock3d';

import { FPCanvas } from './FPCanvas';
import { MutLevel } from '../mutlevel';
import { StatusBar } from './ui/StatusBar';
import { VisualInput } from './VisualInput';

export interface Props {
    /**
     * Level data.
     */
    level: MutLevel;
};

export interface State {
    /**
     * Current camera position.
     */
    camera: r3d.Camera.Camera;
}

export class VisualView extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
        super(props);
        this.moveForward = this.moveForward.bind(this);
        this.moveBackward = this.moveBackward.bind(this);
        this.strafeLeft = this.strafeLeft.bind(this);
        this.strafeRight = this.strafeRight.bind(this);
        this.lookUp = this.lookUp.bind(this);
        this.lookDown = this.lookDown.bind(this);
        this.lookLeft = this.lookLeft.bind(this);
        this.lookRight = this.lookRight.bind(this);

        let camera = r3d.Camera.create(0, 0, 48);
        this.state = {
            camera: camera,
        };
    }

    moveForward() {
        this.setState({ camera: r3d.Camera.moveRelative(
            this.state.camera, 0, 64, 0
        )});
    }

    moveBackward() {
        this.setState({ camera: r3d.Camera.moveRelative(
            this.state.camera, 0, -64, 0
        )});
    }

    strafeLeft() {
        this.setState({ camera: r3d.Camera.moveRelative(
            this.state.camera, -64, 0, 0
        )});
    }

    strafeRight() {
        this.setState({ camera: r3d.Camera.moveRelative(
            this.state.camera, 64, 0, 0
        )});
    }

    lookUp() {
        this.setState({ camera: r3d.Camera.rotateEuler(
            this.state.camera, 15, 0, 0
        )});
    }

    lookDown() {
        this.setState({ camera: r3d.Camera.rotateEuler(
            this.state.camera, -15, 0, 0
        )});
    }

    lookLeft() {
        this.setState({ camera: r3d.Camera.rotateEuler(
            this.state.camera, 0, 0, -15
        )});
    }

    lookRight() {
        this.setState({ camera: r3d.Camera.rotateEuler(
            this.state.camera, 0, 0, 15
        )});
    }

    render(): JSX.Element {
        return <>
            <FPCanvas camera={this.state.camera} level={this.props.level}/>
            <StatusBar/>
            <VisualInput moveForward={this.moveForward} moveBackward={this.moveBackward}
                strafeLeft={this.strafeLeft} strafeRight={this.strafeRight}
                lookUp={this.lookUp} lookDown={this.lookDown}
                lookLeft={this.lookLeft} lookRight={this.lookRight}/>
        </>;
    }
};
