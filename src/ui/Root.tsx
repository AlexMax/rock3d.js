/**
 * rocked.js: An editor for the rock3d engine.
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

/** @jsx jsx */
import { css, jsx } from '@emotion/core';
import React from 'react';
import * as rock3d from 'rock3d';

import { DrawView } from './DrawView';
import { VisualView } from './VisualView';
import { TopMenu } from './TopMenu';

const RootCSS = css({
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
});

const ModeCSS = css({
    flexGrow: 1,
});

export enum Mode {
    DrawView,
    VisualView,
};

type ModeElements = {
    [key in Mode]: any
}

export interface Props {
    levelData: rock3d.LevelData.LevelData;
    mode: Mode;
};

export class Root extends React.Component<Props> {

    constructor(props: Readonly<Props>) {
        super(props);
    }

    render() {
        // Depending on the mode, we render a different component
        const view: ModeElements = {
            [Mode.DrawView]: (<DrawView css={ModeCSS} levelData={this.props.levelData}/>),
            [Mode.VisualView]: (<VisualView css={ModeCSS} levelData={this.props.levelData}/>)
        };

        return <div css={RootCSS}>
            <TopMenu/>
            {view[this.props.mode]}
        </div>;
    }
}
