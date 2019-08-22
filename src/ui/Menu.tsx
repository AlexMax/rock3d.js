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

export class MenuBar extends React.Component {
    render() {
        return <ul className="menu-bar">{this.props.children}</ul>;
    }
}

export class MenuDropdown extends React.Component {
    render() {
        return <ul className="menu-dropdown">{this.props.children}</ul>;
    }
}

export interface MenuItemProps {
    /**
     * Label of the menu item.
     */
    label: string,

    /**
     * Action to call if the item is clicked.
     */
    action?: Function,
};

interface MenuItemState {
    /**
     * True if child items should be shown.
     */
    showChildren: boolean;
}

export class MenuItem extends React.Component<MenuItemProps, MenuItemState> {

    constructor(props: any) {
        super(props);
        this.state = {
            showChildren: false,
        }

        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        if (this.state.showChildren === false) {
            this.setState({ showChildren: true });
        } else {
            this.setState({ showChildren: false });
        }
    }

    render() {
        return <li className="menu-item" onClick={this.onClick}>
            {this.props.label}
            {this.state.showChildren ? this.props.children : null}
        </li>;
    }
}
