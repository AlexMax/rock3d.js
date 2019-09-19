/**
 * rock3d.js: A 3D rendering engine with a retro heart.
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

import { withTitleBar, WrappedProps as TitleBarProps } from './TitleBar';

interface Props extends TitleBarProps { }

class BaseToolbar extends React.Component<Props> {
    render() {
        return <div className="toolbar" style={this.props.positionStyle}>
            {this.props.titleBar}
            <div className="toolbar-button">Select</div>
            <div className="toolbar-button">Line</div>
            <div className="toolbar-button">Polygon</div>
        </div>;
    }
};

const Toolbar = withTitleBar(BaseToolbar);
export { Toolbar };