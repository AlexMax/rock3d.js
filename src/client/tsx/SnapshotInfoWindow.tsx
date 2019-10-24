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
