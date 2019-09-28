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
import { DemoConnection } from '../connection';
import { DemoControlWindow } from './DemoControlWindow';
import { DemoInfoWindow } from './DemoInfoWindow';
import { RenderCanvas } from './RenderCanvas';

const getConn = (client: Client | null) => {
    if (client !== null && client.connection instanceof DemoConnection) {
        return client.connection;
    }
    return null;
}

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
        const conn = getConn(this.state.client);
        if (conn === null) {
            return;
        }
        conn.next();
    }

    private onEnd() {

    }

    render() {
        let info: JSX.Element | null = null;
        const conn = getConn(this.state.client);
        if (conn !== null) {
            info = <DemoInfoWindow tick={conn.getTick()}/>;
        }

        return <div>
                <RenderCanvas client={this.state.client}/>
                <DemoControlWindow
                    onFileLoad={this.onFileLoad}
                    onStart={this.onStart}
                    onLast={this.onLast}
                    onPlay={this.onPlay}
                    onPause={this.onPause}
                    onNext={this.onNext}
                    onEnd={this.onEnd}/>
                {info}
            </div>;
    }
}
