/**
 * rock3d.js: A 3D game engine with a retro heart.
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

import React from "react";

import { TopdownCanvas } from "./TopdownCanvas";
import { EditableLevel } from "../editableLevel";
import { Camera } from "../../r2d/camera";

export interface Props {
    /**
     * Camera that looks at level data.
     */
    camera: Camera;

    /**
     * Grid resolution.
     */
    gridSize: number;

    /**
     * Level data.
     */
    level: EditableLevel;
}

export class LocationInspectMode extends React.Component<Props> {
    render() {
        return <>
            <TopdownCanvas camera={this.props.camera}
                gridSize={this.props.gridSize}
                level={this.props.level}
                onLevelPos={null}
                onLevelClick={null}/>
        </>;
    }
}