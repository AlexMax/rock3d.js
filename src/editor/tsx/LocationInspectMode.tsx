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

import { vec2 } from "gl-matrix";
import React from "react";

import { TopdownCanvas } from "./TopdownCanvas";
import { EditableLevel } from "../editableLevel";
import { Camera } from "../../r2d/camera";
import { LocationInspector } from "./LocationInspector";

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

interface State {
    /**
     * Highlighted location ID.
     */
    highlighted: number | null;

    /**
     * Selected location ID.
     */
    selected: number[];
}

export class LocationInspectMode extends React.Component<Props, State> {

    constructor(props: Readonly<Props>) {
        super(props);

        this.levelPos = this.levelPos.bind(this);
        this.levelClick = this.levelClick.bind(this);

        this.state = {
            highlighted: null,
            selected: []
        };
    }

    /**
     * Moving the mouse around the level possibly highlights a location.
     * 
     * @param mousePos 
     */
    levelPos(mousePos: vec2 | null) {
        if (mousePos === null) {
            this.setState({ highlighted: null });
            return;
        }

        let closest: number | null = null;
        let closestDist = Infinity;
        for (let i = 0;i < this.props.level.locations.length;i++) {
            const location = this.props.level.locations[i];
            const len = vec2.dist(mousePos, location.position);
            if (len <= 16 && len <= closestDist) {
                closest = i;
                closestDist = len;
            }
        }

        this.setState({ highlighted: closest });
    }

    /**
     * Clicking on the level inspects the clicked-on location.
     * 
     * @param mousePos Position of mouse click in level.
     */
    levelClick(mousePos: vec2) {
        if (this.state.highlighted === null) {
            return;
        }
        this.setState({ selected: [this.state.highlighted] });
    }

    render() {
        let inspector: JSX.Element | null = null;
        if (this.state.selected !== null && this.state.selected.length === 1) {
            inspector = <LocationInspector
                level={this.props.level} id={this.state.selected[0]}/>;
        }

        return <>
            <TopdownCanvas camera={this.props.camera}
                gridSize={this.props.gridSize}
                level={this.props.level}
                highlightedLocation={this.state.highlighted}
                onLevelPos={this.levelPos}
                onLevelClick={this.levelClick}/>
            {inspector}
        </>;
    }
}