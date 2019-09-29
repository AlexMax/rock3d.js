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
import { Window } from  '../../tsx/Window';

export interface Props {
    isPlaying: boolean;
    onFileLoad: (data: string) => void;
    onStart: () => void;
    onPrevious: () => void;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onEnd: () => void;
}

export const DemoControlWindow = (props: Readonly<Props>) => {
    if (props.isPlaying) {
        var playPauseButton = <button onClick={props.onPause}>&#9208;</button>;
    } else {
        var playPauseButton = <button onClick={props.onPlay}>&#9205;</button>;
    }

    return <Window title="Demo Controls">
        <FileLoader onLoad={props.onFileLoad}/>
        <button onClick={props.onStart}>&#9198;</button>
        <button onClick={props.onPrevious}>&#9194;&#65038;</button>
        {playPauseButton}
        <button onClick={props.onNext}>&#9193;&#65038;</button>
        <button onClick={props.onEnd}>&#9197;</button>
    </Window>;
}
