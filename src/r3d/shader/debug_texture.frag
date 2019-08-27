/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

precision mediump float;

uniform sampler2D uTexture;

varying vec2 fTex;

void main() {
    vec4 x = texture2D(uTexture, fTex);
    gl_FragColor = vec4(fTex.x, 0.0, fTex.y, 1.0);
}
