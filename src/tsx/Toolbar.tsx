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

import { withTitleBar, WrappedProps as TitleBarProps } from './TitleBar';

interface Props extends TitleBarProps { }

/**
 * A floating toolbar used for holding items or controls without a border.
 */
class BaseToolbar extends React.Component<Props> {
    render() {
        return <div className="toolbar" style={this.props.positionStyle}>
            {this.props.titleBar}
            <div className="toolbar-content">
                {this.props.children}
            </div>
        </div>;
    }
};

interface ToolbarItemProps {
    /**
     * True if the toolbar item should be shown as selected, otherwise false.
     */
    selected: boolean;

    /**
     * Function to call on item click.
     */
    onClick?: () => void;

    /**
     * Title of the item.
     */
    title: string;
}

/**
 * A single item in a toolbar.
 */
export class ToolbarItem extends React.Component<ToolbarItemProps> {
    render() {
        let classes = "no-press";
        if (this.props.selected) {
            classes += " selected";
        }

        return <button className={classes} onClick={this.props.onClick}>
            {this.props.title}
        </button>;
    }
}

const Toolbar = withTitleBar(BaseToolbar);
export { Toolbar };
