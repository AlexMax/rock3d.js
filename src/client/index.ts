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

import { render } from './client';
import { Button, setAxis, setPressed, setReleased } from '../command';
import { loadAssets } from '../r3d/loader';
import { RenderContext } from '../r3d/render';
import { SocketClient } from './socket'; 

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

window.addEventListener("load", async () => {
    // Get our client element.
    const root = document.getElementById('client');
    if (root === null) {
        throw new Error('Could not find root element');
    }

    // Create an element to hold our renderer
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    root.appendChild(canvas);

    // Create the 3D renderer.
    const renderer = new RenderContext(canvas);

    // Load our assets.
    await loadAssets(renderer);

    // Create our client.
    const hostname = window.location.hostname;
    const client = new SocketClient(hostname, 11210);

    // Tie input to our client.
    window.addEventListener('keydown', (evt) => {
        if (evt.keyCode === 192) {
            // User hit tilde, stop the client and dump a packet capture.
            client.halt();
            const json = JSON.stringify(client.connection.demo);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.getElementById('capture');
            if (!(link instanceof HTMLAnchorElement)) {
                throw new Error('Capture is not an anchor element');
            }
            link.download = 'demo.json';
            link.href = url;
            link.textContent = 'Download';
            return;
        }

        const button = keyCodeToButton(evt.keyCode);
        if (button === undefined) {
            return;
        }
        setPressed(client.input, client.input, button);
    });
    window.addEventListener('keyup', (evt) => {
        const button = keyCodeToButton(evt.keyCode);
        if (button === undefined) {
            return;
        }
        setReleased(client.input, client.input, button);
    });
    window.addEventListener('mousemove', (evt) => {
        setAxis(
            client.input, client.input, scalePitch(evt.movementY),
            scaleYaw(evt.movementX)
        );
    });
    window.addEventListener('mousedown', (evt) => {
        const button = mouseButtonToButton(evt.button);
        if (button === undefined) {
            return;
        }
        setPressed(client.input, client.input, button);
    });
    window.addEventListener('mouseup', (evt) => {
        const button = mouseButtonToButton(evt.button);
        if (button === undefined) {
            return;
        }
        setReleased(client.input, client.input, button);
    });

    // Prevent the context menu from popping up
    document.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
    });

    // Run the client.
    client.run();

    // Start our rendering loop too.
    const draw = (): void => {
        render(client, renderer);
        window.requestAnimationFrame(draw);
    }
    window.requestAnimationFrame(draw);
});
