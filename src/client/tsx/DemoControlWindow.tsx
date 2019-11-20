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

export const DemoControlWindow = (props: Readonly<Props>): JSX.Element => {
    const playPauseButton = props.isPlaying ?
        <button onClick={props.onPause}>&#x23EF;&#xFE0E;</button> :
        <button onClick={props.onPlay}>&#x23EF;&#xFE0E;</button>;

    return <Window title="Demo Controls">
        <FileLoader onLoad={props.onFileLoad}/>
        <button onClick={props.onStart}>&#x23EE;&#xFE0E;</button>
        <button onClick={props.onPrevious}>&#x23F4;&#xFE0E;</button>
        {playPauseButton}
        <button onClick={props.onNext}>&#x23F5;&#xFE0E;</button>
        <button onClick={props.onEnd}>&#x23ED;&#xFE0E;</button>
    </Window>;
}
