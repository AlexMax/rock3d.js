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

import { Assets } from '../asset';
import { DemoClient, DemoTick } from '../demo';
import { DemoControlWindow } from './DemoControlWindow';
import { DemoInfoWindow } from './DemoInfoWindow';
import { RenderCanvas } from './RenderCanvas';
import { Snapshot } from '../../snapshot';
import { SnapshotInfoWindow } from './SnapshotInfoWindow';

interface Props {
    /**
     * Currently loaded assets.
     */
    assets: Assets;
}

interface State {
    /**
     * Current demo client.
     */
    client: DemoClient | null;

    /**
     * Current tick data.
     */
    tick: DemoTick | null;

    /**
     * Current snapshot data.
     */
    snapshot: Snapshot | null;

    /**
     * Current number of predicted frames.
     */
    predicted: number | null;

    /**
     * True if the demo is playing, otherwise false.
     */
    isPlaying: boolean;
}

export class DemoRoot extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
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
            predicted: null,
            isPlaying: false,
        }
    }

    private onFileLoad(data: string): void {
        const client = new DemoClient(this.props.assets, data);
        this.setState({
            client: client,
            tick: client.getTick(),
        });
        if (client.sim === null) {
            return;
        }
        this.setState({
            snapshot: client.sim.getSnapshot(),
            predicted: client.sim.predictedFrames(),
        });
    }

    private onStart(): void {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.first();
        this.setState({ tick: client.getTick() });
        if (client.sim === null) {
            return;
        }
        this.setState({
            snapshot: client.sim.getSnapshot(),
            predicted: client.sim.predictedFrames(),
        });
    }

    private onPrevious(): void {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.previous();
        this.setState({ tick: client.getTick() });
        if (client.sim === null) {
            return;
        }
        this.setState({
            snapshot: client.sim.getSnapshot(),
            predicted: client.sim.predictedFrames(),
        });
    }

    private onPlay(): void {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.play();
        this.setState({ isPlaying: true });
    }

    private onPause(): void {
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
        this.setState({
            snapshot: client.sim.getSnapshot(),
            predicted: client.sim.predictedFrames(),
        });
    }

    private onNext(): void {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.next();
        this.setState({ tick: client.getTick() });
        if (client.sim === null) {
            return;
        }
        this.setState({
            snapshot: client.sim.getSnapshot(),
            predicted: client.sim.predictedFrames(),
        });
    }

    private onEnd(): void {
        const client = this.state.client;
        if (client === null) {
            return;
        }
        client.end();
        this.setState({ tick: client.getTick() });
        if (client.sim === null) {
            return;
        }
        this.setState({
            snapshot: client.sim.getSnapshot(),
            predicted: client.sim.predictedFrames(),
        });
    }

    render(): JSX.Element {
        // Only render the info window if we have a tick to render.
        let demoInfo: JSX.Element | null = null;
        if (this.state.tick !== null) {
            demoInfo = <DemoInfoWindow tick={this.state.tick}/>;
        }

        // Only render the snapshot window if we have a snapshot to render.
        let snapshotInfo: JSX.Element | null = null;
        if (this.state.snapshot !== null && this.state.predicted !== null) {
            snapshotInfo = <SnapshotInfoWindow
                snapshot={this.state.snapshot}
                predicted={this.state.predicted}/>;
        }

        return <div>
                <RenderCanvas
                    assets={this.props.assets}
                    client={this.state.client}/>
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
