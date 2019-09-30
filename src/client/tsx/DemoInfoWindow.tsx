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

import React from "react";

import { Input, checkButton, Button } from "../../command";
import { DemoTick } from "../demo";
import {
    ServerMessage, ServerHello, ServerPing, ServerSnapshot, ServerMessageType
} from "../../proto";
import { Window } from  '../../tsx/Window';

const helloMessage = (key: number, hello: ServerHello) => {
    return <div key={key}>
        <strong>Hello Message</strong> Client ID: {hello.clientID}
    </div>;
}

const pingMessage = (key: number, ping: ServerPing) => {
    return <div key={key}>
        <strong>Ping Message</strong> RTT: {ping.rtt}
    </div>;
}

const snapshotMessage = (key: number, snap: ServerSnapshot) => {
    return <div key={key}>
        <strong>Snapshot Message</strong><br/>
        Snapshot: <code>{JSON.stringify(snap.snapshot)}</code><br/>
        Commands: <code>{JSON.stringify(snap.commands)}</code><br/>
        Health: <code>{snap.health !== null ? snap.health : 'None'}</code>
    </div>;
}

const readCapture = (msgs: ServerMessage[]) => {
    const eles: JSX.Element[] = [];

    for (let [idx, msg] of msgs.entries()) {
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

const inputCapture = (input: Input) => {
    const buttons: string[] = [];
    if (checkButton(input, Button.WalkForward)) {
        buttons.push('WalkForward');
    }
    if (checkButton(input, Button.WalkBackward)) {
        buttons.push('WalkBackward');
    }
    if (checkButton(input, Button.StrafeLeft)) {
        buttons.push('StrafeLeft');
    }
    if (checkButton(input, Button.StrafeRight)) {
        buttons.push('StrafeRight');
    }
    if (checkButton(input, Button.Attack)) {
        buttons.push('Attack');
    }
    if (checkButton(input, Button.Jump)) {
        buttons.push('Jump');
    }
    if (checkButton(input, Button.Use)) {
        buttons.push('Use');
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

export const DemoInfoWindow = (props: Props) => {
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
