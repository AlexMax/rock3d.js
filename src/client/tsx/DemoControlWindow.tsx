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
