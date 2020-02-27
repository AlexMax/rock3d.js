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

precision mediump float;

uniform sampler2D uTexture;

varying vec4 fAtlasInfo;
varying vec2 fTexCoord;
varying vec3 fBright;

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

    vec4 color = texture2D(uTexture, texCord);
    color.x *= fBright.x;
    color.y *= fBright.y;
    color.z *= fBright.z;
    // [AM] Uncomment this to show texture coordinates as red and blue gradient.
    // color.x = texCord.x;
    // color.y = 0.0;
    // color.z = texCord.y;
    gl_FragColor = color;
}
