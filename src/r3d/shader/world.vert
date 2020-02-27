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

uniform mat4 uProjection;
uniform mat4 uView;

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
