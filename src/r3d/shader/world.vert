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

uniform mat4 uView;
uniform mat4 uProjection;

attribute vec3 lPos;
attribute vec4 lAtlasInfo;
attribute vec2 lTexCoord;
attribute vec3 lBright;

varying vec4 fAtlasInfo;
varying vec2 fTexCoord;
varying vec3 fBright;

void main() {
    fAtlasInfo = lAtlasInfo;
    fBright = lBright;

    gl_Position = uProjection * uView * vec4(lPos, 1.0);

    float uAtOrigin = lAtlasInfo.x;
    float vAtOrigin = lAtlasInfo.y;
    float uAtLen = lAtlasInfo.z;
    float vAtLen = lAtlasInfo.w;

    fTexCoord.x = (lTexCoord.x * uAtLen) + uAtOrigin;
    fTexCoord.y = (lTexCoord.y * vAtLen) + vAtOrigin;
}
