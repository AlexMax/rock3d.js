/**
 * rock3d.js: A 3D rendering engine with a retro heart.
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

import { Client } from './client'; 
import { Axis, Button } from '../command';
import { RenderContext } from '../r3d/render';

import { loadAssets } from './loader';

const keyCodeToButton = (keyCode: number) => {
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

const mouseButtonToButton = (button: number) => {
    switch (button) {
        case 0: // left mouse button
            return Button.Attack;
    }
}

const scaleYaw = (movement: number) => {
    return movement;
}

const scalePitch = (movement: number) => {
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
    const client = new Client(renderer);

    // Tie input to our client.
    window.addEventListener('keydown', (evt) => {
        if (evt.keyCode === 192) {
            // User hit tilde, stop the client and dump a packet capture.
            client.halt();
            const now = performance.now();
            const dump = document.getElementById('dump') as HTMLTextAreaElement;
            dump.value = JSON.stringify(client.capture.filter((ele) => {
                return ele.time > now - 1000;
            }));
            return;
        }

        const button = keyCodeToButton(evt.keyCode);
        if (button === undefined) {
            return;
        }
        client.buttonState(button, true);
    });
    window.addEventListener('keyup', (evt) => {
        const button = keyCodeToButton(evt.keyCode);
        if (button === undefined) {
            return;
        }
        client.buttonState(button, false);
    });
    window.addEventListener('mousemove', (evt) => {
        client.axisMove(Axis.Pitch, scalePitch(evt.movementY));
        // Yaw axis is right-to-left so we need to flip our X axis.
        client.axisMove(Axis.Yaw, scaleYaw(-evt.movementX));
    });
    window.addEventListener('mousedown', (evt) => {
        const button = mouseButtonToButton(evt.button);
        if (button === undefined) {
            return;
        }
        client.buttonState(button, true);
    });
    window.addEventListener('mouseup', (evt) => {
        const button = mouseButtonToButton(evt.button);
        if (button === undefined) {
            return;
        }
        client.buttonState(button, false);
    });

    // Prevent the context menu from popping up
    document.addEventListener("contextmenu", (evt) => {
        evt.preventDefault();
    });

    // Run the client.
    client.run();

    // Start our rendering loop too.
    const draw = () => {
        client.render();
        window.requestAnimationFrame(draw);
    }
    window.requestAnimationFrame(draw);
});

