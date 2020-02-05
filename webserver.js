/**
 * rock3d.js: A 3D game engine with a retro heart.
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
