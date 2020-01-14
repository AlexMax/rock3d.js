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

import { Window } from  '../../tsx/Window';

interface Props {
    health: number;
    calc: number;
    scale: number;
    p: number;
    i: number;
    d: number;
    pError: number;
    iError: number;
    dError: number;
}

export const HealthInfoWindow = (props: Readonly<Props>): JSX.Element => {
    return <Window title="Health Info">
        <table>
            <tbody>
                <tr>
                    <th>Health</th><td>{props.health}</td>
                    <th>Calc</th><td>{props.calc.toFixed(2)}</td>
                    <th>Scale</th><td>{props.scale.toFixed(2)}</td>
                </tr>
                <tr>
                    <th>P</th><td>{props.p} / {props.pError}</td>
                    <th>I</th><td>{props.i} / {props.iError}</td>
                    <th>D</th><td>{props.d} / {props.dError}</td>
                </tr>
            </tbody>
        </table>
    </Window>;
}
