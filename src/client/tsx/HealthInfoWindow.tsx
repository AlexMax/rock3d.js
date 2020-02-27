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
