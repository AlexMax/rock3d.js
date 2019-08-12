interface AtlasEntry {
    texture: HTMLImageElement;
    xPos: number;
    yPos: number;
}

interface AtlasShelf {
    width: number;
    height: number;
}

interface AtlasHash {
    [name: string]: AtlasEntry;
}

export class Atlas {
    atlas: AtlasHash;
    length: number; // Length of one side of the texture atlas - it's square
    shelves: AtlasShelf[];

    constructor(size: number) {
        this.atlas = Object.create(null);
        this.length = size;
        this.shelves = [];
    }

    add(texName: string, tex: HTMLImageElement) {
        if (tex.width > this.length || tex.height > this.length) {
            throw new Error("Texture is too big for the atlas");
        }

        let y = 0;
        for (let i = 0;i < this.shelves.length;i++) {
            const shelf = this.shelves[i];
            // Can the shelf hold it?
            if (tex.height <= shelf.height) {
                // Is there space on the shelf?
                if (tex.width <= this.length - shelf.width) {
                    // There is!  Put the altas entry there, then adjust the shelf.
                    this.atlas[texName] = {
                        texture: tex,
                        xPos: shelf.width,
                        yPos: y
                    };
                    shelf.width += tex.width;

                    return;
                }
            }

            // No room on this shelf, go to the next...
            y += shelf.height;
        }

        // We have no space in any of our existing shelves.  Do we have space
        // for a new shelf?
        if (tex.height <= this.length - y) {
            // We do!  Create the new shelf and put the atlas entry there.
            this.shelves.push({
                width: tex.width,
                height: tex.height,
            });
            this.atlas[texName] = {
                texture: tex,
                xPos: 0,
                yPos: y
            };

            return;
        }

        throw new Error('No space left in texture atlas');
    }
}
