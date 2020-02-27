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

import { Snapshot } from "../../snapshot";
import { Window } from  '../../tsx/Window';

const entities = (snapshot: Snapshot['entities']): JSX.Element => {
    const snap = Array.from(snapshot.entries());
    return <code>{JSON.stringify(snap)}</code>;
}

export interface Props {
    /**
     * Current snapshot we're looking at.
     */
    snapshot: Snapshot;

    /**
     * Number of predicted frames.
     */
    predicted: number;
}

export const SnapshotInfoWindow = (props: Props): JSX.Element => {
    return <Window title="Snapshot Info">
        <table style={{fontSize: '80%', margin: '1em', width: '320px', whiteSpace: 'normal' }}>
            <tbody>
                <tr><th>Client Clock: {props.snapshot.clock}</th></tr>
                <tr><th>Predicted Frames: {props.predicted}</th></tr>
                <tr><th>Entities</th></tr>
                <tr><td>{entities(props.snapshot.entities)}</td></tr>
            </tbody>
        </table>
    </Window>;
}
