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

import { MenuBar, MenuDropdown, MenuItem } from './Menu';

export class TopMenu extends React.Component {
    render() {
        return <nav>
            <MenuBar>
                <MenuItem label="File">
                    <MenuDropdown>
                        <MenuItem label="About"/>
                    </MenuDropdown>
                </MenuItem>
                <MenuItem label="Edit">
                    <MenuDropdown>
                        <MenuItem label="Undo"/>
                        <MenuItem label="Cut"/>
                        <MenuItem label="Copy"/>
                        <MenuItem label="Paste"/>
                    </MenuDropdown>
                </MenuItem>
                <MenuItem label="View">
                    <MenuDropdown>
                        <MenuItem label="Draw"/>
                        <MenuItem label="Visual"/>
                    </MenuDropdown>
                </MenuItem>
                <MenuItem label="Help">
                    <MenuDropdown>
                        <MenuItem label="About"/>
                    </MenuDropdown>
                </MenuItem>
            </MenuBar>
        </nav>;
    }
};
