const { readdirSync, statSync, writeFileSync } = require("fs");
const { join, sep } = require("path");

/**
 * Crawl a directory and return a list of all files in that directory.
 * 
 * @param {string} dir Directory to crawl.
 * @returns {string[]}
 */
const crawlDirRecursive = (dir) => {
    const out = [];
    const files = readdirSync(dir);
    for (const file of files) {
        if (file === 'files.json') {
            // Don't consider the output file.
            continue;
        }
        if (file.substr(0, 1) === '.') {
            // Ignore dotfiles.
            continue;
        }

        const realFile = join(dir, file);
        const stat = statSync(realFile);
        if (stat.isDirectory()) {
            out.push(...crawlDirRecursive(realFile));
        } else {
            out.push(realFile);
        }
    }
    return out;
}

// Generate a list of files for the asset directory.
const baseDir = join(__dirname, 'asset');
const files = crawlDirRecursive(baseDir).map((file) => {
    // Remove the base directory from the string.
    const trimFile = file.substr(baseDir.length + 1);
    if (sep === '\\') {
        // We always want forward slashes, even on Windows.
        return trimFile.replace(sep, '/');
    } else {
        return trimFile;
    }
});

// Write the file list to disk as a JSON file.
writeFileSync(join(__dirname, 'asset', 'files.json'), JSON.stringify({
    files: files
}));