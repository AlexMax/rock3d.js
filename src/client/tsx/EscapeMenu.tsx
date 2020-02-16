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
    onReturn: () => void;
    onHealthInfo: () => void;
    onDownloadDemo: () => void;
    onStopClient: () => void;
}

interface State { }

export class EscapeMenu extends React.Component<Props, State> {

    render(): JSX.Element {
        return <Window title="rock3d">
            <div>
                <button onClick={this.props.onReturn}>Return to Game</button>
            </div>
            <div>
                <button onClick={this.props.onHealthInfo}>Toggle Health Info</button>
            </div>
            <div>
                <button onClick={this.props.onDownloadDemo}>Download Demo</button>
            </div>
            <div>
                <button onClick={this.props.onStopClient}>Stop the Client</button>
            </div>
        </Window>;
    }
}