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

import { Toolbar, ToolbarItem } from "../../tsx/Toolbar";
import { Mode } from "./EditorRoot";

interface Props {
    selectedMode: Mode;
    onLocationInspect: () => void;
    onPolygonInspect: () => void;
    onEdgeInspect: () => void;
    onVertexInspect: () => void;
}

export class ModeToolbar extends React.Component<Props> {

    render() {
        return <Toolbar title="Mode">
            <ToolbarItem
                selected={this.props.selectedMode === Mode.LocationInspect}
                onClick={this.props.onLocationInspect}
                title="Location"/>
            <ToolbarItem
                selected={this.props.selectedMode === Mode.PolygonInspect}
                onClick={this.props.onPolygonInspect}
                title="Polygon"/>
            <ToolbarItem
                selected={this.props.selectedMode === Mode.EdgeInspect}
                onClick={this.props.onEdgeInspect}
                title="Edge"/>
            <ToolbarItem
                selected={this.props.selectedMode === Mode.VertexInspect}
                onClick={this.props.onVertexInspect}
                title="Vertex"/>
        </Toolbar>;
    }
}