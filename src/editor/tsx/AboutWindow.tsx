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

import { name, repository_url, version } from '../package';
import { Window } from '../../tsx/Window';

interface Props {
    onClose: () => void;
}

export class AboutWindow extends React.Component<Props> {

    render() {
        return <Window title={`About ${name}`}>
            <div style={{margin: '1em', width: '640px', whiteSpace: 'normal' }}>
                <p>
                    rock3d.js: A 3D game engine for making retro FPS games<br>
                    Copyright (C) 2018 Alex Mayfield <alexmax2742@gmail.com>
                </p>
                <p>
                    This software is provided 'as-is', without any express or implied
                    warranty.  In no event will the authors be held liable for any damages
                    arising from the use of this software.
                </p>
                <p>
                    Permission is granted to anyone to use this software for any purpose,
                    including commercial applications, and to alter it and redistribute it
                    freely, subject to the following restrictions:
                </p>
                <ol>
                    <li>
                        The origin of this software must not be misrepresented; you must not
                        claim that you wrote the original software. If you use this software
                        in a product, an acknowledgment in the product documentation would be
                        appreciated but is not required.
                    </li>
                    <li>
                        Altered source versions must be plainly marked as such, and must not be
                        misrepresented as being the original software.
                    </li>
                    <li>
                        This notice may not be removed or altered from any source distribution.
                    </li>
                </ol>
                <button onClick={this.props.onClose}>Close</button>
            </div>
        </Window>;
    }
}
