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

import React from 'react';

import { FileLoader } from './FileLoader';
import { Window } from  '../../editor/tsx/ui/Window';

export interface Props {
    onFileLoad: (data: string) => void;
    onStart: () => void;
    onLast: () => void;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onEnd: () => void;
}

export class DemoControlWindow extends React.Component<Props> {
    render() {
        return <Window title="Demo Controls">
            <FileLoader onLoad={this.props.onFileLoad}/>
            <button onClick={this.props.onStart}>&#9198;</button>
            <button onClick={this.props.onLast}>&#9194;&#65038;</button>
            <button onClick={this.props.onPlay}>&#9205;</button>
            <button onClick={this.props.onPause}>&#9208;</button>
            <button onClick={this.props.onNext}>&#9193;&#65038;</button>
            <button onClick={this.props.onEnd}>&#9197;</button>
        </Window>;
    }
}
