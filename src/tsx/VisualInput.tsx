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
    lookUp: () => void;
    lookDown: () => void;
    lookLeft: () => void;
    lookRight: () => void;
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
        console.log(evt.key);
        switch (evt.key) {
        case 'w': case 'ArrowUp': this.props.moveForward(); break;
        case 's': case 'ArrowDown': this.props.moveBackward(); break;
        case 'a': this.props.strafeLeft(); break;
        case 'd': this.props.strafeRight(); break;
        case 'PageUp': this.props.lookUp(); break;
        case 'PageDown': this.props.lookDown(); break;
        case 'ArrowLeft': this.props.lookLeft(); break;
        case 'ArrowRight': this.props.lookRight(); break;
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
