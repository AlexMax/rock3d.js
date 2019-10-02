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

import { AboutWindow } from './AboutWindow';
import { DrawView } from './DrawView';
import { isLevelData } from '../../leveldata';
import { MutLevel } from '../mutlevel';
import { TopMenu } from './TopMenu';
import { VisualView } from './VisualView';

import TESTMAP from '../../../asset/TESTMAP.json';

export enum Mode {
    DrawView,
    VisualView,
};

interface State {
    level: MutLevel | null;
    mode: Mode | null;
    modal: JSX.Element | null;
};

export class Root extends React.Component<{}, State> {

    constructor(props: Readonly<{}>) {
        super(props);
        this.closeModal = this.closeModal.bind(this);
        this.openFile = this.openFile.bind(this);
        this.closeFile = this.closeFile.bind(this);
        this.drawView = this.drawView.bind(this);
        this.visualView = this.visualView.bind(this);
        this.about = this.about.bind(this);

        this.state = {
            level: null,
            mode: null,
            modal: null,
        };
    }

    closeModal() {
        this.setState({ modal: null });
    }

    openFile() {
        if (!isLevelData(TESTMAP)) {
            throw new Error('Map data is not valid');
        }

        const level = new MutLevel(TESTMAP);
        this.setState({ level: level, mode: Mode.DrawView });
    }

    closeFile() {
        this.setState({ level: null, mode: null });
    }

    drawView() {
        if (this.state.level === null) {
            return;
        }
        this.setState({ mode: Mode.DrawView });
    }

    visualView() {
        if (this.state.level === null) {
            return;
        }
        this.setState({ mode: Mode.VisualView });
    }

    about() {
        this.setState({ modal: <AboutWindow onClose={this.closeModal}/> });
    }

    render() {
        let modeElement: JSX.Element | null = null;
        if (this.state.level !== null) {
            switch (this.state.mode) {
            case Mode.DrawView:
                modeElement = <DrawView level={this.state.level}/>;
                break;
            case Mode.VisualView:
                modeElement = <VisualView level={this.state.level}/>;
                break;
            }
        }

        return <div className="root">
            <TopMenu onOpenFile={this.openFile} onCloseFile={this.closeFile} 
                onDrawView={this.drawView} onVisualView={this.visualView}
                onAbout={this.about}/>
            <div className="mode">
                {modeElement}
            </div>
            {this.state.modal}
        </div>;
    }
}
