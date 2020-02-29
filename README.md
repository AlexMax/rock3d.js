rock3d.js
=========
A 3D game engine for making retro FPS games.

What is this?
-------------
This is a 3D game engine designed specifically to replicate the retro look of old classic shooters of the 90's, commonly called 2.5D shooters.  Level geometry consists of 2D polygons projected into 3D space, and objects in the world are billboarded sprites.

What is this not?
-----------------
This engine is not derived from id Tech 1, BUILD or Marathon's engine.  It does not play any classic 90's shooter out of the box.  The renderer is GPU-accelerated; there are no plans for a traditional software renderer.

Building
--------
This engine consists of a client, server and editor.

```
$ npm run build-client
$ npm run build-server
$ npm run build-editor
```

If you are building the client, you must also build a files manifest so the client knows what files it has access to.

```
$ npm run build-files
```

Running
-------
To run the client or editor, serve the `/public` directory using your webserver of choice, or if you want to get up and running quickly, you can use the built-in webserver by running the `webserver` task:

```
npm run webserver
```

You can run the game server like this:

```
$ npm run server
```

License
-------
This project is licensed under the [zlib/libpng][1] license:

> rock3d.js: A 3D game engine for making retro FPS games
>
> Copyright &copy; 2018 Alex Mayfield <alexmax2742@gmail.com>
> 
> This software is provided 'as-is', without any express or implied
> warranty.  In no event will the authors be held liable for any damages
> arising from the use of this software.
>
> Permission is granted to anyone to use this software for any purpose,
> including commercial applications, and to alter it and redistribute it
> freely, subject to the following restrictions:
>
> 1. The origin of this software must not be misrepresented; you must not
>    claim that you wrote the original software. If you use this software
>    in a product, an acknowledgment in the product documentation would be
>    appreciated but is not required.
> 2. Altered source versions must be plainly marked as such, and must not be
>    misrepresented as being the original software.
> 3. This notice may not be removed or altered from any source distribution.

The following is a list of runtime dependencies and their licenses:

| npm package  | License  |
| ------------ | -------- |
| content-type | [MIT][2] |
| earcut       | [ISC][3] |
| gl-matrix    | [MIT][2] |
| react        | [MIT][2] |
| react-dom    | [MIT][2] |
| ws           | [MIT][2] |

[1]: https://opensource.org/licenses/Zlib
[2]: https://opensource.org/licenses/MIT
[3]: https://opensource.org/licenses/ISC

This repository contains graphical and sound assets courtesy of the [Freedoom][4] project, and are provided under their original [3-clause BSD license][5].  These assets are for demonstration purposes and are not necessary for the proper functioning of the engine if you use your own assets instead.

[4]: https://freedoom.github.io/
[5]: https://opensource.org/licenses/BSD-3-Clause
