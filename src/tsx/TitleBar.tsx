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

    /**
     * The style used to position the wrapped element.
     */
    positionStyle: React.CSSProperties;
};

export interface WrappedProps {
    positionStyle: React.CSSProperties;
    titleBar: JSX.Element;
};

type WrapperComponent = new (props: Props) => React.Component<Props, State>;
type WrappedComponent = new (...any: any[]) => React.Component<WrappedProps>;

export const withTitleBar = (
    WrappedComponent: WrappedComponent
): WrapperComponent => {
    return class extends React.Component<Props, State> {

        ref: any;

        constructor(props: Readonly<Props>) {
            super(props);

            this.ref = React.createRef();
            this.onMouseDown = this.onMouseDown.bind(this);
            this.onGlobalMouseUp = this.onGlobalMouseUp.bind(this);
            this.onGlobalMouseMove = this.onGlobalMouseMove.bind(this);

            this.state = {
                mouseDown: false,
                mouseDownPos: null,
                mouseDownMousePos: null,
                positionStyle: {
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                }
            };
        }

        onMouseDown(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
            const ele = this.ref.current;
            if (ele === null) {
                throw new Error('Missing element');
            }

            const rect = ele.getBoundingClientRect();

            this.setState({
                mouseDown: true,
                mouseDownPos: {
                    left: rect.left,
                    top: rect.top,
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

            const style: Position = {
                left: this.state.mouseDownPos.left + evt.pageX - this.state.mouseDownMousePos.left,
                top: this.state.mouseDownPos.top + evt.pageY - this.state.mouseDownMousePos.top,
            }

            this.setState({
                positionStyle: style
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
            const titleBar = <div ref={this.ref} className="title-bar" onMouseDown={this.onMouseDown}>
                {this.props.title}
            </div>;
            return <WrappedComponent positionStyle={this.state.positionStyle}
                titleBar={titleBar}>{this.props.children}
            </WrappedComponent>;
        }
    };
}
