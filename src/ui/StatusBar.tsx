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

const RootCSS = css({
    backgroundColor: 'var(--window-bg-color)',
    border: '1px solid',
    borderColor: 'var(--window-border-color)',
    display: 'flex',
});

export class StatusBar extends React.Component {
    render() {
        return <div css={RootCSS}>
            <div>320, 240</div>
        </div>;
    }
};
