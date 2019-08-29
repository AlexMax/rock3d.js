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
    panUp: () => void;
    panDown: () => void;
    panLeft: () => void;
    panRight: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    gridIn: () => void;
    gridOut: () => void;
};

/**
 * This component is a handler for Draw view keyboard commands.
 */
export class DrawInput extends React.Component<Props> {

    constructor(props: Readonly<Props>) {
        super(props);
        this.onGlobalKeydown = this.onGlobalKeydown.bind(this);
        this.onGlobalWheel = this.onGlobalWheel.bind(this);
    }

    onGlobalKeydown(evt: KeyboardEvent) {
        switch (evt.key) {
        case 'w': case 'ArrowUp': this.props.panUp(); break;
        case 's': case 'ArrowDown': this.props.panDown(); break;
        case 'a': case 'ArrowLeft': this.props.panLeft(); break;
        case 'd': case 'ArrowRight': this.props.panRight(); break;
        case '[': this.props.gridOut(); break;
        case ']': this.props.gridIn(); break;
        }
    }

    onGlobalWheel(evt: WheelEvent) {
        if (evt.deltaY > 0) {
            this.props.zoomOut();
        } else if (evt.deltaY < 0) {
            this.props.zoomIn();
        }
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onGlobalKeydown);
        document.addEventListener('wheel', this.onGlobalWheel);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onGlobalKeydown);
        document.removeEventListener('wheel', this.onGlobalWheel);
    }

    render() {
        return null;
    }
}
