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
