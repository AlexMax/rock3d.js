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

import { DemoTick } from "../connection";

export interface Props {
    /**
     * Current tick of demo we're looking at.
     */
    tick: DemoTick;
}

export class TickInfo extends React.Component<Props> {

    render() {
        return <table>
            <tbody>
                <tr>
                    <td>Clock</td><td>{this.props.tick.clock}</td>
                    <td>Server info</td><td>{this.props.tick.readCapture.toString()}</td>
                    <td>Inputs</td><td>{this.props.tick.inputCapture.toString()}</td>
                </tr>
            </tbody>
        </table>;
    }
}
