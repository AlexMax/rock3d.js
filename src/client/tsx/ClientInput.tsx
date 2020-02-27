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

import { Button, setAxis, setPressed, setReleased } from '../../command';
import { Demo } from '../demo';
import { SocketClient } from '../socket';

const keyCodeToButton = (keyCode: number): Button | undefined => {
    switch (keyCode) {
        case 87: // w
            return Button.WalkForward;
        case 83: // d
            return Button.WalkBackward;
        case 65: // a
            return Button.StrafeLeft;
        case 68: // d
            return Button.StrafeRight;
        case 69: // e
            return Button.Use;
        case 32: // Spacebar
            return Button.Jump;
    }
}

const mouseButtonToButton = (button: number): Button | undefined => {
    switch (button) {
        case 0: // left mouse button
            return Button.Attack;
    }
}

const scaleYaw = (movement: number): number => {
    return -movement;
}

const scalePitch = (movement: number): number => {
    return movement;
}

interface Props {
    /**
     * Client to operate on.
     */
    client: SocketClient;
}

/**
 * An input handler that uses React to manage lifetime.
 */
export class ClientInput extends React.Component<Props> {

    constructor(props: Readonly<Props>) {
        super(props);

        this.onGlobalKeydown = this.onGlobalKeydown.bind(this);
        this.onGlobalKeyup = this.onGlobalKeyup.bind(this);
        this.onGlobalMousemove = this.onGlobalMousemove.bind(this);
        this.onGlobalMousedown = this.onGlobalMousedown.bind(this);
        this.onGlobalMouseup = this.onGlobalMouseup.bind(this);
    }

    private onGlobalKeydown(evt: KeyboardEvent) {
        if (evt.repeat) {
            // Don't pay attention to repeated keypresses.
            return;
        }

        if (evt.keyCode === 27) {
            // User hit escape, let pointerlockchange handle it.
            return;
        }

        const button = keyCodeToButton(evt.keyCode);
        if (button === undefined) {
            return;
        }
        setPressed(this.props.client.input, this.props.client.input, button);
    }

    private onGlobalKeyup(evt: KeyboardEvent) {
        const button = keyCodeToButton(evt.keyCode);
        if (button === undefined) {
            return;
        }
        setReleased(this.props.client.input, this.props.client.input, button);
    }

    private onGlobalMousemove(evt: MouseEvent) {
        setAxis(
            this.props.client.input, this.props.client.input,
            scalePitch(evt.movementY), scaleYaw(evt.movementX)
        );
    }

    private onGlobalMousedown(evt: MouseEvent) {
        const button = mouseButtonToButton(evt.button);
        if (button === undefined) {
            return;
        }
        setPressed(this.props.client.input, this.props.client.input, button);
    }

    private onGlobalMouseup(evt: MouseEvent) {
        const button = mouseButtonToButton(evt.button);
        if (button === undefined) {
            return;
        }
        setReleased(this.props.client.input, this.props.client.input, button);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.onGlobalKeydown);
        document.addEventListener('keyup', this.onGlobalKeyup);
        document.addEventListener('mousemove', this.onGlobalMousemove);
        document.addEventListener('mousedown', this.onGlobalMousedown);
        document.addEventListener('mouseup', this.onGlobalMouseup);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onGlobalKeydown);
        document.removeEventListener('keyup', this.onGlobalKeyup);
        document.removeEventListener('mousemove', this.onGlobalMousemove);
        document.removeEventListener('mousedown', this.onGlobalMousedown);
        document.removeEventListener('mouseup', this.onGlobalMouseup);
    }

    render() {
        return null;
    }
}
