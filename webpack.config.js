const path = require('path');

const editor = {
    name: 'editor',
    entry: './src/editor/index.ts',
    mode: "production",
    module: {
        rules: [{
            exclude: /node_modules/,
            test: /\.tsx?$/,
            use: 'ts-loader'
        }, {
            exclude: /node_modules/,
            test: /\.png$/,
            use: 'file-loader'
        }, {
            exclude: /node_modules/,
            test: /\.(frag|vert)$/,
            use: 'raw-loader'
        }]
    },
    output: {
        filename: 'editor.js',
        path: path.resolve(__dirname, 'public/dist'),
        publicPath: '/dist/'
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx']
    }
};

const client = {
    name: 'client',
    entry: './src/client/index.ts',
    mode: "production",
    module: {
        rules: [{
            exclude: /node_modules/,
            test: /\.tsx?$/,
            use: 'ts-loader'
        }, {
            exclude: /node_modules/,
            test: /\.png$/,
            use: 'file-loader'
        }, {
            exclude: /node_modules/,
            test: /\.(frag|vert)$/,
            use: 'raw-loader'
        }]
    },
    output: {
        filename: 'client.js',
        path: path.resolve(__dirname, 'public/dist'),
        publicPath: '/dist/'
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx']
    }
};

const server = {
    name: 'server',
    entry: './src/server/index.ts',
    mode: "production",
    target: 'node',
    module: {
        rules: [{
            exclude: /node_modules/,
            test: /\.ts$/,
            use: 'ts-loader'
        }, {
            exclude: /node_modules/,
            test: /\.png$/,
            use: 'file-loader'
        }]
    },
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.js', '.ts']
    }
};

module.exports = [ editor, client, server ];
