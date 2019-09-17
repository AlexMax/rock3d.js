/**
 * rock3d.js: A 3D rendering engine with a retro heart.
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
    gl_FragColor = color;
}
