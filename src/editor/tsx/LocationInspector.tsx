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

import React from "react";
import { EditableLevel } from "../editableLevel";
import { Window } from "../../tsx/Window";

interface Props {
    level: EditableLevel;
    id: number;
}

export class LocationInspector extends React.Component<Props> {
    render() {
        const location = this.props.level.locations[this.props.id];

        return <Window title="Location Inspector">
            <div>
                ID: {this.props.id}
            </div>
            <div>
                Type: {location.type}
            </div>
            {location.entityConfig ?
            <div>
                Entity Config: {location.entityConfig}
            </div> : null}
            <div>
                Polygon: {location.polygon}
            </div>
            <div>
                Position: {location.position}
            </div>
            <div>
                Rotation: {location.rotation}
            </div>
        </Window>;
    }
}