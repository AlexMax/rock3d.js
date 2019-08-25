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

import { name, repository_url, version } from '../package';
import { Window } from './ui/Window';

export class AboutWindow extends React.Component {

    render() {
        return <Window title={`About ${name}`}>
            <div style={{margin: '1em', width: '640px', whiteSpace: 'normal' }}>
                <p>
                    {name} v{version}<br/>
                    Copyright &copy; 2018&ndash;2019&nbsp;
                    <a href="mailto:alexmax2742@gmail.com">Alex Mayfield</a>
                </p>
                <p>
                    This program is free software: you can redistribute it
                    and/or modify it under the terms of the GNU Affero General
                    Public License as published by the Free Software Foundation,
                    either version 3 of the License, or (at your option) any
                    later version.
                </p>
                <p>
                    This program is distributed in the hope that it will be
                    useful, but WITHOUT ANY WARRANTY; without even the implied
                    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
                    PURPOSE.  See the GNU Affero General Public License for
                    more details.
                </p>
                <p>
                    You should have received a copy of the GNU Affero General
                    Public License along with this program.  If not, see&nbsp;
                    <a target="_blank" href="https://www.gnu.org/licenses/">
                        https://www.gnu.org/licenses/
                    </a>.
                </p>
                <p>
                    The source code of this program may be obtained from&nbsp;
                    <a target="_blank" href={repository_url}>{repository_url}</a>.
                </p>
            </div>
        </Window>;
    }
}
