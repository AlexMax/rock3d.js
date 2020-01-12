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

import { Assets } from '../asset';
import { ClientInput } from './ClientInput';
import { Demo } from '../demo';
import { RenderCanvas } from './RenderCanvas';
import { SocketClient } from '../socket';
import { DemoDownloadWindow } from './DemoDownloadWindow';

interface Props {
    /**
     * Loaded assets.
     */
    assets: Assets;

    /**
     * Hostname to connect to.
     */
    hostname: string,

    /**
     * Port to connect to.
     */
    port: number,
}

interface State {
    /**
     * Current client.
     */
    client: SocketClient;

    /**
     * Demo to show demo download for.
     */
    demo: Demo | null;
}

export class ClientRoot extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
        super(props);

        this.demoDownload = this.demoDownload.bind(this);

        this.state = {
            client: new SocketClient(
                this.props.assets,
                this.props.hostname,
                this.props.port
            ),
            demo: null,
        };

        this.state.client.run();
    }

    private demoDownload(demo: Demo) {
        this.setState({ demo: demo });
    }

    render(): JSX.Element {
        let demoDownload: JSX.Element | null = null;
        if (this.state.demo !== null) {
            demoDownload = <DemoDownloadWindow demo={this.state.demo}/>;
        }

        return <div>
            <RenderCanvas
                assets={this.props.assets}
                client={this.state.client}/>
            <ClientInput
                client={this.state.client}
                onDemoDownload={this.demoDownload}/>
            {demoDownload}
        </div>;
    }
}