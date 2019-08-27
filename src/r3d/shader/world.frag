/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

precision mediump float;

uniform sampler2D uTexture;

varying vec4 fAtlasInfo;
varying vec2 fTexCoord;

float zNear = 1.0;
float zFar = 10000.0;

float linearDepth(float coord) {
    float ndcCoord = coord * 2.0 - 1.0;
    return (2.0 * zNear * zFar) / (zFar + zNear - ndcCoord * (zFar - zNear));
}

float wrap(float coord, float origin, float len) {
    return mod(coord - origin, len) + origin;
}

void main() {
    float uAtOrigin = fAtlasInfo.x;
    float vAtOrigin = fAtlasInfo.y;
    float uAtLen = fAtlasInfo.z;
    float vAtLen = fAtlasInfo.w;

    vec2 texCord;
    texCord.x = wrap(fTexCoord.x, uAtOrigin, uAtLen);
    texCord.y = wrap(fTexCoord.y, vAtOrigin, vAtLen);

    gl_FragColor = texture2D(uTexture, texCord);
}
