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

import { localFileLoader } from "../../r3d/loader";

export interface Props {
    /**
     * Function to call when we've loaded the file.
     */
    onLoad: (data: string) => void;
}

export class FileLoader extends React.Component<Props> {

    constructor(props: Readonly<Props>) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    async onChange(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
        const files = event.target.files;
        if (files === null) {
            return;
        }

        const data = await localFileLoader(files[0]);
        this.props.onLoad(data);
    }

    render(): JSX.Element {
        return <input type="file" onChange={this.onChange}/>;
    }
}
