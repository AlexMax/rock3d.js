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

interface Position {
    left: number;
    top: number;
}

export interface Props {
    /**
     * The title to use for the title bar
     */
    title: string,
};

export interface State {
    mouseDown: boolean;
    mouseDownPos: Position | null;
    mouseDownMousePos: Position | null;
    pos: Position;
};

export interface WrappedProps {
    pos: Position;
    titleBar: JSX.Element;
};

type WrapperComponent = new (props: Props) => React.Component<Props, State>;
type WrappedComponent = new (...any: any[]) => React.Component<WrappedProps>;

export function withTitleBar(WrappedComponent: WrappedComponent): WrapperComponent {
    return class extends React.Component<Props, State> {

        constructor(props: Readonly<Props>) {
            super(props);

            this.onMouseDown = this.onMouseDown.bind(this);
            this.onGlobalMouseUp = this.onGlobalMouseUp.bind(this);
            this.onGlobalMouseMove = this.onGlobalMouseMove.bind(this);

            this.state = {
                mouseDown: false,
                mouseDownPos: null,
                mouseDownMousePos: null,
                pos: {
                    left: 32,
                    top: 32,
                }
            };
        }

        onMouseDown(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
            this.setState({
                mouseDown: true,
                mouseDownPos: {
                    left: this.state.pos.left,
                    top: this.state.pos.top,
                },
                mouseDownMousePos: {
                    left: evt.pageX,
                    top: evt.pageY,
                }
            });
        }

        onGlobalMouseUp(evt: MouseEvent) {
            this.setState({
                mouseDown: false,
                mouseDownPos: null,
                mouseDownMousePos: null,
            });
            evt.stopPropagation();
        }

        onGlobalMouseMove(evt: MouseEvent) {
            if (this.state.mouseDownPos === null) {
                throw new Error('mouseDownPos is null');
            }
            if (this.state.mouseDownMousePos === null) {
                throw new Error('mouseDownMousePos is null');
            }

            const pos: Position = {
                left: this.state.mouseDownPos.left + evt.pageX - this.state.mouseDownMousePos.left,
                top: this.state.mouseDownPos.top + evt.pageY - this.state.mouseDownMousePos.top,
            }

            this.setState({
                pos: pos
            });
            evt.stopPropagation();
        }

        componentDidUpdate(_: Readonly<Props>, prevState: Readonly<State>) {
            // Attach event listeners globally, to avoid escaping the div.
            // Source: https://stackoverflow.com/a/20927899
            if (this.state.mouseDown === true && prevState.mouseDown === false) {
                document.addEventListener('mouseup', this.onGlobalMouseUp);
                document.addEventListener('mousemove', this.onGlobalMouseMove);
            } else if (this.state.mouseDown === false && prevState.mouseDown === true) {
                document.removeEventListener('mouseup', this.onGlobalMouseUp);
                document.removeEventListener('mousemove', this.onGlobalMouseMove);
            }
        }

        render() {
            const titleBar = <div className="title-bar" onMouseDown={this.onMouseDown}>
                {this.props.title}
            </div>;
            return <WrappedComponent pos={this.state.pos} titleBar={titleBar}>
                {this.props.children}
            </WrappedComponent>;
        }
    };
}
