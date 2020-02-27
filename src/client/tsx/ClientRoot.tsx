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

import { HealthInfo, AppAPI } from '../api';
import { Assets } from '../asset';
import { ClientInput } from './ClientInput';
import { Demo } from '../demo';
import { DemoDownloadWindow } from './DemoDownloadWindow';
import { HealthInfoWindow } from './HealthInfoWindow';
import { RenderCanvas } from './RenderCanvas';
import { SocketClient } from '../socket';
import { EscapeMenu } from './EscapeMenu';

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
     * True if menu is opened, otherwise false.
     */
    inMenu: boolean;

    /**
     * True if health information should be drawn, otherwise false.
     */
    showHealthInfo: boolean;

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

    div: React.RefObject<HTMLDivElement>;

    constructor(props: Readonly<Props>) {
        super(props);

        this.onPointerLockChange = this.onPointerLockChange.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.toggleHealthInfo = this.toggleHealthInfo.bind(this);
        this.downloadDemo = this.downloadDemo.bind(this);
        this.stopClient = this.stopClient.bind(this);
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
            inMenu: true,
            showHealthInfo: false,
            healthInfo: null,
            demo: null,
        };

        this.div = React.createRef();

        this.state.client.run();
    }

    componentDidMount() {
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
    }

    componentWillUnmount() {
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    }

    private onPointerLockChange() {
        if (document.pointerLockElement) {
            this.setState({ inMenu: false });
        } else {
            this.setState({ inMenu: true });
        }
    }

    private closeMenu() {
        const div = this.div.current;
        if (!div) {
            throw new Error("Lost div on menu toggle.");
        }

        div.requestPointerLock();
    }

    private toggleHealthInfo() {
        if (this.state.showHealthInfo) {
            this.setState({ showHealthInfo: false });
        } else {
            this.setState({ showHealthInfo: true });
        }
    }

    private downloadDemo() {
        this.state.client.halt();
        this.setState({ demo: this.state.client.connection.demo });
    }

    private stopClient() {
        this.state.client.halt();
    }

    private updateHealthInfo(info: HealthInfo) {
        this.setState({ healthInfo: info });
    }

    private demoDownload(demo: Demo) {
        this.setState({ demo: demo });
    }

    render(): JSX.Element {
        let escapeMenu: JSX.Element | null = null;
        let clientInput: JSX.Element | null = null;
        if (this.state.inMenu) {
            escapeMenu = <EscapeMenu
                onCloseMenu={this.closeMenu}
                onHealthInfo={this.toggleHealthInfo}
                onDownloadDemo={this.downloadDemo}
                onStopClient={this.stopClient}
            />
            clientInput = null;
        } else {
            escapeMenu = null;
            clientInput = <ClientInput client={this.state.client}/>
        }

        let healthInfo: JSX.Element | null = null;
        if (
            this.state.showHealthInfo &&
            this.state.healthInfo !== null
        ) {
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

        return <div ref={this.div}>
            {clientInput}
            <RenderCanvas
                assets={this.props.assets}
                client={this.state.client}/>
            {escapeMenu}
            {healthInfo}
            {demoDownload}
        </div>;
    }
}