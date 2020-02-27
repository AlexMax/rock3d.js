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
export class TopdownInput extends React.Component<Props> {

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
