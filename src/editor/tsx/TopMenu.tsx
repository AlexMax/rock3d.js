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

import { MenuConfig, MenuBar } from './ui/Menu';

export interface Props {
    onOpenFile: () => void;
    onCloseFile: () => void;
    onDrawView: () => void;
    onVisualView: () => void;
    onAbout: () => void;
};

export class TopMenu extends React.Component<Props> {
    render() {
        const menuConfig: MenuConfig = [{
            label: 'File',
            subMenu: [{
                label: 'New',
            }, {
                label: 'Open',
                action: this.props.onOpenFile,
            }, {
                label: 'Close',
                action: this.props.onCloseFile,
            }],
        }, {
            label: 'Edit',
            subMenu: [{
                label: 'Undo',
            }, {
                label: 'Cut',
            }, {
                label: 'Copy',
            }, {
                label: 'Paste',
            }],
        }, {
            label: 'View',
            subMenu: [{
                label: 'Draw',
                action: this.props.onDrawView,
            }, {
                label: 'Visual',
                action: this.props.onVisualView,
            }],
        }, {
            label: 'Help',
            subMenu: [{
                label: 'About',
                action: this.props.onAbout,
            }],
        }];

        return <nav><MenuBar config={menuConfig}/></nav>;
    }
};
