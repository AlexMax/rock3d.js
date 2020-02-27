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

import React from "react";

import { Button, Input, checkPressed, checkReleased } from "../../command";
import { DemoTick } from "../demo";
import {
    ServerMessage, ServerHello, ServerPing, ServerSnapshot, ServerMessageType
} from "../../proto";
import { Window } from  '../../tsx/Window';

const helloMessage = (key: number, hello: ServerHello): JSX.Element => {
    return <div key={key}>
        <strong>Hello Message</strong> Client ID: {hello.clientID}
    </div>;
}

const pingMessage = (key: number, ping: ServerPing): JSX.Element => {
    return <div key={key}>
        <strong>Ping Message</strong> RTT: {ping.rtt}
    </div>;
}

const snapshotMessage = (key: number, snap: ServerSnapshot): JSX.Element => {
    return <div key={key}>
        <strong>Snapshot Message</strong><br/>
        Snapshot: <code>{JSON.stringify(snap.snapshot)}</code><br/>
        Commands: <code>{JSON.stringify(snap.commands)}</code><br/>
        Health: <code>{snap.health !== null ? snap.health : 'None'}</code>
    </div>;
}

const readCapture = (msgs: ServerMessage[]): JSX.Element => {
    const eles: JSX.Element[] = [];

    for (const [idx, msg] of msgs.entries()) {
        switch (msg.type) {
        case ServerMessageType.Hello:
            eles.push(helloMessage(idx, msg));
            break;
        case ServerMessageType.Ping:
            eles.push(pingMessage(idx, msg));
            break;
        case ServerMessageType.Snapshot:
            eles.push(snapshotMessage(idx, msg));
            break;
        }
    }

    return <div>
        {eles}
    </div>;
}

const inputCapture = (input: Input): JSX.Element => {
    const buttons: string[] = [];
    if (checkPressed(input, Button.WalkForward)) {
        buttons.push('+WalkForward');
    }
    if (checkReleased(input, Button.WalkForward)) {
        buttons.push('-WalkForward');
    }
    if (checkPressed(input, Button.WalkBackward)) {
        buttons.push('+WalkBackward');
    }
    if (checkReleased(input, Button.WalkBackward)) {
        buttons.push('-WalkBackward');
    }
    if (checkPressed(input, Button.StrafeLeft)) {
        buttons.push('+StrafeLeft');
    }
    if (checkReleased(input, Button.StrafeLeft)) {
        buttons.push('-StrafeLeft');
    }
    if (checkPressed(input, Button.StrafeRight)) {
        buttons.push('+StrafeRight');
    }
    if (checkReleased(input, Button.StrafeRight)) {
        buttons.push('-StrafeRight');
    }
    if (checkPressed(input, Button.Attack)) {
        buttons.push('+Attack');
    }
    if (checkReleased(input, Button.Attack)) {
        buttons.push('-Attack');
    }
    if (checkPressed(input, Button.Jump)) {
        buttons.push('+Jump');
    }
    if (checkReleased(input, Button.Jump)) {
        buttons.push('-Jump');
    }
    if (checkPressed(input, Button.Use)) {
        buttons.push('+Use');
    }
    if (checkReleased(input, Button.Use)) {
        buttons.push('-Use');
    }
    if (buttons.length === 0) {
        buttons.push('None');
    }

    return <div>
        <strong>Buttons:</strong> {buttons.join(', ')}&nbsp;
        <strong>Pitch:</strong> {input.pitch}&nbsp;
        <strong>Yaw:</strong> {input.yaw}
    </div>;
}

export interface Props {
    /**
     * Current tick of demo we're looking at.
     */
    tick: DemoTick;
}

export const DemoInfoWindow = (props: Props): JSX.Element => {
    return <Window title="Demo Info">
        <table style={{fontSize: '80%', margin: '1em', width: '320px', whiteSpace: 'normal' }}>
            <tbody>
                <tr><th>Client Clock: {props.tick.clock}</th></tr>
                <tr><th>Server Messages</th></tr>
                <tr><td>{readCapture(props.tick.readCapture)}</td></tr>
                <tr><th>Local Inputs</th></tr>
                <tr><td>{inputCapture(props.tick.inputCapture)}</td></tr>
            </tbody>
        </table>
    </Window>;
}
