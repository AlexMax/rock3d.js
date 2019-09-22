rock3d.js
=========
A 3D game engine with a retro heart.

What is this?
-------------
This is a 3D game engine designed specifically to replicate the retro look of old classic shooters of the 90's, commonly called 2.5D shooters.  Level geometry consists of 2D polygons projected into 3D space, and objects in the world are billboarded sprites.

What is this not?
-----------------
This engine is not derived from id Tech 1, BUILD or Marathon's engine.  It does not play any classic 90's shooter out of the box.  The renderer is GPU-accelerated; there are no plans for a traditional software renderer.

Building
--------
```
$ npm run build
```

Running
-------
To run the client or editor, serve the `/public` directory using your webserver of choice, or if you want to get up and running quickly, download [Caddy][1] and run the executable straight out of the root directory of this repository.

[1]: https://caddyserver.com/

You can run the game server like this:

```
$ npm run server
```

License
-------
This program is licensed under the [GNU Affero General Public License v3.0][2].  There are also assets bundled with the project that are licensed under the [3-Clause BSD License][3].

In the future, I intend to split the project into a core engine, a standalone editor, and a standalone game, with the core engine being relicensed under the [zlib/libpng License][4].  For now, it is more expedient to work with all three parts out of a single repository under a single license.

[2]: https://www.gnu.org/licenses/agpl-3.0.en.html
[3]: https://opensource.org/licenses/BSD-3-Clause
[4]: https://opensource.org/licenses/zlib
