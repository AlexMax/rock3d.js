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

import { HealthInfo, AppAPI } from '../api';
import { Assets } from '../asset';
import { ClientInput } from './ClientInput';
import { Demo } from '../demo';
import { DemoDownloadWindow } from './DemoDownloadWindow';
import { HealthInfoWindow } from './HealthInfoWindow';
import { RenderCanvas } from './RenderCanvas';
import { SocketClient } from '../socket';

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
     * Health information.
     */
    healthInfo: HealthInfo | null;

    /**
     * Demo to show demo download for.
     */
    demo: Demo | null;
}

export class ClientRoot extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
        super(props);

        this.updateHealthInfo = this.updateHealthInfo.bind(this);
        this.demoDownload = this.demoDownload.bind(this);

        const api: AppAPI = {
            updateHealthInfo: this.updateHealthInfo
        };

        this.state = {
            client: new SocketClient(
                this.props.assets,
                api,
                this.props.hostname,
                this.props.port
            ),
            healthInfo: null,
            demo: null,
        };

        this.state.client.run();
    }

    private updateHealthInfo(info: HealthInfo) {
        this.setState({ healthInfo: info });
    }

    private demoDownload(demo: Demo) {
        this.setState({ demo: demo });
    }

    render(): JSX.Element {
        let healthInfo: JSX.Element | null = null;
        if (this.state.healthInfo !== null) {
            healthInfo = <HealthInfoWindow
                health={this.state.healthInfo.health}
                calc={this.state.healthInfo.calc}
                scale={this.state.healthInfo.scale}
                p={this.state.healthInfo.p}
                i={this.state.healthInfo.i}
                d={this.state.healthInfo.d}
                pError={this.state.healthInfo.pError}
                iError={this.state.healthInfo.iError}
                dError={this.state.healthInfo.dError}/>;
        }

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
            {healthInfo}
            {demoDownload}
        </div>;
    }
}