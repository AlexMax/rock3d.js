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

const express = require('express');

/**
 * A dev webserver.
 *
 * Used to test client, demoplayer and editor during development.  Not
 * intended for production use, use a real webserver.
 */
const app = express();

app.use('/asset', express.static('asset'));
app.use(express.static('public'));

const server = app.listen(8080, function () {
    let addr = server.address();
    if (typeof addr !== 'string') {
        if (addr.family === 'IPv6') {
            addr = `[${addr.address}]:${addr.port}`;
        } else {
            addr = `${addr.address}:${addr.port}`;
        }
    }
    console.log(`Listening on ${addr}...`);
});
