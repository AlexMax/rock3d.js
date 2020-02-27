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

interface MenuItemConfig {
    /**
     * Text label of the menu item.
     */
    label: string;

    /**
     * Action to take on left click.
     */
    action?: Function;

    /**
     * Submenu of menu item, if any.
     */
    subMenu?: MenuConfig;
};

export type MenuConfig = MenuItemConfig[];

interface MenuBarProps {
    /**
     * Configuration of menubar and submenus.
     */
    config: MenuConfig;
}

interface MenuBarState {
    /**
     * Currently enabled submenu or null if no submenu selected.
     */
    current: string | null;
}

/**
 * A menu bar that stretches left to right.
 */
export class MenuBar extends React.Component<MenuBarProps, MenuBarState> {

    constructor(props: any) {
        super(props);
        this.closeSubmenus = this.closeSubmenus.bind(this);
        this.onChildSelect = this.onChildSelect.bind(this);

        this.state = {
            current: null,
        };
    }

    /**
     * Close any submenus.
     * 
     * Pass this method to any submenus so they can close the menu upon 
     * selection of an item or clicking outside the menu.
     */
    closeSubmenus() {
        this.setState({ current: null });
    }

    /**
     * Called when an immediate child menu item is selected.
     */
    onChildSelect(value: string) {
        this.setState({ current: value });
    }

    render() {
        const menuItems: JSX.Element[] = [];

        this.props.config.forEach((item, index) => {
            const sindex = String(index);
            let drawSubmenu = false;
            if (sindex === this.state.current) {
                drawSubmenu = true;
            }

            menuItems.push(<MenuItem key={index} value={sindex}
                closeMenu={this.closeSubmenus} onSelect={this.onChildSelect}
                config={item} drawSubmenu={drawSubmenu}/>);
        });

        return <ul className="menu-bar">{menuItems}</ul>;
    }
}

interface MenuDropdownProps {
    /**
     * A passed function that closes the menu tree.
     */
    closeMenu: () => void;

    /**
     * Configuration of menubar and submenus.
     */
    config: MenuConfig;
}

interface MenuDropdownState {
    /**
     * Currently enabled submenu or null if no submenu selected.
     */
    current: string | null;
}

/**
 * A menu that drops down and overlays content.
 */
export class MenuDropdown extends React.Component<MenuDropdownProps, MenuDropdownState> {

    ref: React.RefObject<HTMLUListElement>;

    constructor(props: Readonly<MenuDropdownProps>) {
        super(props);
        this.onChildSelect = this.onChildSelect.bind(this);
        this.onGlobalClick = this.onGlobalClick.bind(this);

        this.ref = React.createRef();
        this.state = {
            current: null,
        };
    }

    /**
     * Called when an immediate child menu item is selected.
     */
    onChildSelect(value: string) {
        this.setState({ current: value });
    }

    onGlobalClick(evt: MouseEvent) {
        if (this.ref.current === null) {
            throw new Error('MenuDropdown is missing ref');
        }
        if (evt.target === null) {
            throw new Error('MenuDropdown onGlobalClick event is missing target');
        }

        // Did we click outside of our current element and its parents?
        if (!this.ref.current.contains(evt.target as Node)) {
            // We did!  Close the entire menu.
            document.removeEventListener('click', this.onGlobalClick);
            this.props.closeMenu();
        }
    }

    componentDidMount() {
        document.addEventListener('click', this.onGlobalClick);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.onGlobalClick);
    }

    render() {
        const menuItems: JSX.Element[] = [];

        this.props.config.forEach((item, index) => {
            const sindex = String(index);
            let drawSubmenu = false;
            if (sindex === this.state.current) {
                drawSubmenu = true;
            }

            menuItems.push(<MenuItem key={index} value={sindex}
                closeMenu={this.props.closeMenu} onSelect={this.onChildSelect}
                config={item} drawSubmenu={drawSubmenu}/>);
        });

        return <ul ref={this.ref} className="menu-dropdown">{menuItems}</ul>;
    }
}

export interface MenuItemProps {
    /**
     * A passed function that closes the menu tree.
     */
    closeMenu: () => void;

    /**
     * Configuration of single menu item.
     */
    config: MenuItemConfig;

    /**
     * If true, submenus should be drawn.
     */
    drawSubmenu: boolean;

    /**
     * This function is called to signal that an item was just selected.
     */
    onSelect?: (value: string) => void;

    /**
     * A unique value for this menu item.  Usually the same as the key.
     */
    value: string;
};

interface MenuItemState { };

/**
 * A single menu item.  Can be for a dropdown or bar menu.
 */
export class MenuItem extends React.Component<MenuItemProps, MenuItemState> {

    constructor(props: Readonly<MenuItemProps>) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    onClick(evt: React.MouseEvent) {
        if (this.props.config.action !== undefined) {
            // The menu item itself does something.
            this.props.config.action();
            this.props.closeMenu();

            // Prevent reopening the menu we just closed.
            evt.stopPropagation();
        } else if (this.props.onSelect !== undefined) {
            // The menu has a submenu.
            this.props.onSelect(this.props.value);
        }
    }

    render() {
        let subMenu = null;
        if (this.props.config.subMenu !== undefined && this.props.drawSubmenu === true) {
            subMenu = <MenuDropdown closeMenu={this.props.closeMenu}
                config={this.props.config.subMenu}/>;
        }

        return <li className="menu-item" onClick={this.onClick}>
            {this.props.config.label}{subMenu}
        </li>;
    }
}
