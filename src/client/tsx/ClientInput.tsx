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

    /**
     * Function to call on menu toggle.
     */
    onToggleMenu: () => void;
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
            // User hit escape, show the menu.
            this.props.onToggleMenu();

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
