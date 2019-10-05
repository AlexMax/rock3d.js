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

import { DemoClient, DemoTick } from '../demo';
import { DemoControlWindow } from './DemoControlWindow';
import { DemoInfoWindow } from './DemoInfoWindow';
import { RenderCanvas } from './RenderCanvas';
import { Snapshot } from '../../snapshot';
import { SnapshotInfoWindow } from './SnapshotInfoWindow';

interface State {
    /**
     * Current demo client.
     */
    client: DemoClient | null,

    /**
     * Current tick data.
     */
    tick: DemoTick | null,

    /**
     * Current snapshot data.
     */
    snapshot: Snapshot | null,

    /**
     * True if the demo is playing, otherwise false.
     */
    isPlaying: boolean,
}

export class DemoRoot extends React.Component<{}, State> {

    constructor(props: Readonly<{}>) {
        super(props);

        this.onFileLoad = this.onFileLoad.bind(this);
        this.onStart = this.onStart.bind(this);
        this.onPrevious = this.onPrevious.bind(this);
        this.onPlay = this.onPlay.bind(this);
        this.onPause = this.onPause.bind(this);
        this.onNext = this.onNext.bind(this);
        this.onEnd = this.onEnd.bind(this);

        this.state = {
            client: null,
            tick: null,
            snapshot: null,
            isPlaying: false,
        }
    }

    private onFileLoad(data: string) {
        const client = new DemoClient(data);
        this.setState({
            client: client,
            tick: client.getTick(),
        });
        if (client.sim === null) {
            return;
        }
        this.setState({
            snapshot: client.sim.getSnapshot()
        });
    }

    private onStart() {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.first();
        this.setState({ tick: client.getTick() });
        if (client.sim === null) {
            return;
        }
        this.setState({ snapshot: client.sim.getSnapshot() });
    }

    private onPrevious() {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.previous();
        this.setState({ tick: client.getTick() });
        if (client.sim === null) {
            return;
        }
        this.setState({ snapshot: client.sim.getSnapshot() });
    }

    private onPlay() {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.play();
        this.setState({ isPlaying: true });
    }

    private onPause() {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.pause();
        this.setState({
            isPlaying: false,
            tick: client.getTick(),
        });
        if (client.sim === null) {
            return;
        }
        this.setState({ snapshot: client.sim.getSnapshot() });
    }

    private onNext() {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.next();
        this.setState({ tick: client.getTick() });
        if (client.sim === null) {
            return;
        }
        this.setState({ snapshot: client.sim.getSnapshot() });
    }

    private onEnd() {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.end();
        this.setState({ tick: client.getTick() });
        if (client.sim === null) {
            return;
        }
        this.setState({ snapshot: client.sim.getSnapshot() });
    }

    render() {
        // Only render the info window if we have a tick to render.
        let demoInfo: JSX.Element | null = null;
        if (this.state.tick !== null) {
            demoInfo = <DemoInfoWindow tick={this.state.tick}/>;
        }

        // Only render the snapshot window if we have a snapshot to render.
        let snapshotInfo: JSX.Element | null = null;
        if (this.state.snapshot !== null) {
            snapshotInfo = <SnapshotInfoWindow snapshot={this.state.snapshot}/>;
        }

        return <div>
                <RenderCanvas client={this.state.client}/>
                <DemoControlWindow
                    isPlaying={this.state.isPlaying}
                    onFileLoad={this.onFileLoad}
                    onStart={this.onStart}
                    onPrevious={this.onPrevious}
                    onPlay={this.onPlay}
                    onPause={this.onPause}
                    onNext={this.onNext}
                    onEnd={this.onEnd}/>
                {demoInfo}
                {snapshotInfo}
            </div>;
    }
}
