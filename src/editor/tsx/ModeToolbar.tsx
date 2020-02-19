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

interface Props {
    selectedMode: "location" | "polygon" | "edge" | "vertex";
    onLocationMode: () => void;
    onPolygonMode: () => void;
    onEdgeMode: () => void;
    onVertexMode: () => void;
}

export class ModeToolbar extends React.Component<Props> {

    render() {
        return <Toolbar title="Mode">
            <ToolbarItem
                active={this.props.selectedMode === "location"}
                onClick={this.props.onLocationMode}
                title="Location"/>
            <ToolbarItem
                active={this.props.selectedMode === "polygon"}
                onClick={this.props.onPolygonMode}
                title="Polygon"/>
            <ToolbarItem
                active={this.props.selectedMode === "edge"}
                onClick={this.props.onEdgeMode}
                title="Edge"/>
            <ToolbarItem
                active={this.props.selectedMode === "vertex"}
                onClick={this.props.onVertexMode}
                title="Vertex"/>
        </Toolbar>;
    }
}