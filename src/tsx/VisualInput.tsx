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

export interface Props {
    moveForward: () => void;
    moveBackward: () => void;
    strafeLeft: () => void;
    strafeRight: () => void;
    floatUp: () => void;
    floatDown: () => void;
    rollCW: () => void;
    rollCCW: () => void;
    pitchUp: () => void;
    pitchDown: () => void;
    yawLeft: () => void;
    yawRight: () => void;
}

/**
 * This component is a handler for Visual view keyboard commands.
 */
export class VisualInput extends React.Component<Props> {

    constructor(props: Readonly<Props>) {
        super(props);
        this.onGlobalKeydown = this.onGlobalKeydown.bind(this);
    }

    onGlobalKeydown(evt: KeyboardEvent) {
        switch (evt.key) {
        case 'w': this.props.moveForward(); break;
        case 's': this.props.moveBackward(); break;
        case 'a': this.props.strafeLeft(); break;
        case 'd': this.props.strafeRight(); break;
        case 'q': this.props.rollCCW(); break;
        case 'e': this.props.rollCW(); break;
        case 'PageUp': this.props.floatUp(); break;
        case 'PageDown': this.props.floatDown(); break;
        case 'ArrowUp': this.props.pitchUp(); break;
        case 'ArrowDown': this.props.pitchDown(); break;
        case 'ArrowLeft': this.props.yawLeft(); break;
        case 'ArrowRight': this.props.yawRight(); break;
        }
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onGlobalKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onGlobalKeydown);
    }

    render() {
        return null;
    }
}
