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

import { Client } from '../client';
import { FileLoader } from './FileLoader';
import { DemoConnection } from '../connection';
import { RenderCanvas } from './RenderCanvas';
import { TickInfo } from './TickInfo';

interface State {
    client: Client | null,
}

export class DemoRoot extends React.Component<{}, State> {

    constructor(props: Readonly<{}>) {
        super(props);

        this.onFileLoad = this.onFileLoad.bind(this);
        this.onStart = this.onStart.bind(this);
        this.onLast = this.onLast.bind(this);
        this.onPlay = this.onPlay.bind(this);
        this.onPause = this.onPause.bind(this);
        this.onNext = this.onNext.bind(this);
        this.onEnd = this.onEnd.bind(this);

        this.state = {
            client: null,
        }
    }

    private onFileLoad(data: string) {
        this.setState({
            client: new Client(new DemoConnection(data)),
        });
    }

    private onStart() {

    }

    private onLast() {

    }

    private onPlay() {

    }

    private onPause() {

    }

    private onNext() {

    }

    private onEnd() {

    }

    render() {
        let info: JSX.Element | null = null;
        if (this.state.client !== null && this.state.client.connection instanceof DemoConnection) {
            info = <TickInfo tick={this.state.client.connection.getTick()}/>;
        }

        return <div>
            <div>
                <RenderCanvas client={this.state.client}/>
            </div>
            {info}
            <FileLoader onLoad={this.onFileLoad}/>
            <button onClick={this.onStart}>&#9198;</button>
            <button onClick={this.onLast}>&#9194;&#65038;</button>
            <button onClick={this.onPlay}>&#9205;</button>
            <button onClick={this.onPause}>&#9208;</button>
            <button onClick={this.onNext}>&#9193;&#65038;</button>
            <button onClick={this.onEnd}>&#9197;</button>
        </div>;
    }
}
