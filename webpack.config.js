const path = require('path');

module.exports = {
    entry: './src/index.ts',
    mode: "production",
    module: {
        rules: [{
            exclude: /node_modules/,
            test: /\.ts$/,
            use: 'ts-loader'
        }, {
            exclude: /node_modules/,
            test: /\.glsl$/,
            use: 'raw-loader'
        }]
    },
    output: {
        filename: 'index.js',
        library: 'rock3d',
        libraryTarget: 'umd',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.glsl', '.ts']
    }
};
