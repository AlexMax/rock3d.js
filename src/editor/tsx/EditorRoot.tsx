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

import { Assets } from '../../client/asset';
import { AboutWindow } from './AboutWindow';
import { createEditableLevel, EditableLevel } from '../editableLevel';
import { assertSerializedLevel } from '../../level';
import { TopMenu } from './TopMenu';
import { ModeToolbar } from './ModeToolbar';
import { TopdownView } from './TopdownView';

export enum Mode {
    LocationInspect,
    PolygonInspect,
    EdgeInspect,
    VertexInspect,
};

interface Props {
    assets: Assets;
};

interface State {
    /**
     * Level data.
     */
    level: EditableLevel | null;

    /**
     * Currently selected mode.
     */
    mode: Mode | null;

    /**
     * Current modal element, if any.
     */
    modal: JSX.Element | null;
};

export class EditorRoot extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
        super(props);
        this.closeModal = this.closeModal.bind(this);
        this.openFile = this.openFile.bind(this);
        this.closeFile = this.closeFile.bind(this);
        this.about = this.about.bind(this);
        this.locationInspect = this.locationInspect.bind(this);
        this.polygonInspect = this.polygonInspect.bind(this);
        this.edgeInspect = this.edgeInspect.bind(this);
        this.vertexInspect = this.vertexInspect.bind(this);

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
        const mapAsset = this.props.assets.get('map/TESTMAP.json');
        if (mapAsset === undefined) {
            throw new Error('TESTMAP does not exist.');
        } else if (mapAsset.type !== 'JSON') {
            throw new Error('TESTMAP is not JSON.');
        }

        const map = mapAsset.data;
        assertSerializedLevel(map);

        const level = createEditableLevel(map);
        this.setState({ level: level, mode: Mode.LocationInspect });
    }

    closeFile() {
        this.setState({ level: null, mode: null });
    }

    about() {
        this.setState({ modal: <AboutWindow onClose={this.closeModal} /> });
    }

    locationInspect() {
        this.setState({ mode: Mode.LocationInspect });
    }

    polygonInspect() {
        this.setState({ mode: Mode.PolygonInspect });
    }

    edgeInspect() {
        this.setState({ mode: Mode.EdgeInspect });
    }

    vertexInspect() {
        this.setState({ mode: Mode.VertexInspect });
    }

    render() {
        if (this.state.level !== null && this.state.mode !== null) {
            return <>
                <TopMenu onOpenFile={this.openFile} onCloseFile={this.closeFile}
                    onAbout={this.about} />
                <TopdownView mode={this.state.mode} level={this.state.level}/>
                <ModeToolbar
                    selectedMode={this.state.mode}
                    onLocationInspect={this.locationInspect}
                    onPolygonInspect={this.polygonInspect}
                    onEdgeInspect={this.edgeInspect}
                    onVertexInspect={this.vertexInspect} />
                {this.state.modal}
            </>;
        } else {
            return <>
                <TopMenu onOpenFile={this.openFile} onCloseFile={this.closeFile}
                    onAbout={this.about} />
                {this.state.modal}
            </>;
        }
    }
}
