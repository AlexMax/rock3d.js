/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

uniform sampler2D uTexture;

attribute vec3 lPos;
attribute vec2 lTex;

varying vec2 fTex;

void main() {
    fTex = lTex;
    gl_Position = vec4(lPos, 1.0);
}
