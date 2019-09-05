/**
 * rock3d.js: A 3D rendering engine with a retro heart.
 * Copyright (c) 2018-2019 Alex Mayfield <alexmax2742@gmail.com>
 * 
 * For conditions of distribution and use, see LICENSE file included with
 * source distribution.
 */

uniform mat4 uView;
uniform mat4 uProjection;

attribute vec3 lPos;
attribute vec4 lAtlasInfo;
attribute vec2 lTexCoord;

varying vec4 fAtlasInfo;
varying vec2 fTexCoord;

void main() {
    fAtlasInfo = lAtlasInfo;

    gl_Position = uProjection * uView * vec4(lPos, 1.0);

    float uAtOrigin = lAtlasInfo.x;
    float vAtOrigin = lAtlasInfo.y;
    float uAtLen = lAtlasInfo.z;
    float vAtLen = lAtlasInfo.w;

    fTexCoord.x = (lTexCoord.x * uAtLen) + uAtOrigin;
    fTexCoord.y = (lTexCoord.y * vAtLen) + vAtOrigin;
}
