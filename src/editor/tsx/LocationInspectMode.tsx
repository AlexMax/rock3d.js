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