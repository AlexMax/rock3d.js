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

import { Assets } from '../../client/asset';
import { AboutWindow } from './AboutWindow';
import { DrawView } from './DrawView';
import { createEditableLevel, EditableLevel } from '../editableLevel';
import { isSerializedLevel } from '../../level';
import { TopMenu } from './TopMenu';
import { VisualView } from './VisualView';

export enum Mode {
    DrawView,
    VisualView,
};

interface Props {
    assets: Assets;
};

interface State {
    level: EditableLevel | null;
    mode: Mode | null;
    modal: JSX.Element | null;
};

export class Root extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
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
        // Load the map.
        const map = this.props.assets.get('map/TESTMAP.json');
        if (map === undefined) {
            throw new Error('TESTMAP does not exist.');
        } else if (map.type !== 'JSON') {
            throw new Error('TESTMAP is not JSON.');
        }

        if (!isSerializedLevel(map)) {
            throw new Error('Map data is not valid');
        }

        const level = createEditableLevel(map);
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
                modeElement = <VisualView
                                    assets={this.props.assets}
                                    level={this.state.level}/>;
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
