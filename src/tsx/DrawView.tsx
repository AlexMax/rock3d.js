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

import React from 'react';

import { MutLevel } from '../mutlevel';
import { Toolbar } from './ui/Toolbar';
import { TopdownCanvas } from './TopdownCanvas';
import { Window } from './ui/Window';

export interface Props {
    level: MutLevel;
};

export class DrawView extends React.Component<Props> {

    constructor(props: Readonly<Props>) {
        super(props);
    }

    render(): JSX.Element {
        return <div>
            <TopdownCanvas level={this.props.level}/>
            <Toolbar title="A Test Toolbar"/>
            <Window title="A Test Window"/>
        </div>;
    }
};
