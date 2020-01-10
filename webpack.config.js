const { resolve } = require('path');
const CssExtract = require('mini-css-extract-plugin');
const Html = require('html-webpack-plugin');

const config = [{
    name: "client",
    entry: {
        index: resolve(__dirname, "src/client/index.ts"),
        demoIndex: resolve(__dirname, "src/client/demoIndex.ts")
    },
    mode: "production",
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: [{
                loader: 'ts-loader',
                options: {
                    configFile: resolve(__dirname, "src/client/tsconfig.json")
                }
            }],
        }, {
            test: /\.css$/,
            use: [CssExtract.loader, 'css-loader'],
        }, {
            test: /\.(vert|frag)$/,
            use: ['raw-loader'],
        }]
    },
    output: {
        filename: "[name]-[chunkhash:8].js",
        path: resolve(__dirname, "public/client")
    },
    plugins: [
        new CssExtract({
            filename: "[name]-[contenthash:8].css",
        }),
        new Html({
            chunks: ['index'],
            filename: resolve(__dirname, "public/client/index.html"),
            title: 'rock3d client'
        }),
        new Html({
            chunks: ['demoIndex'],
            filename: resolve(__dirname, "public/client/demoIndex.html"),
            title: 'rock3d demo player'
        })
    ],
    resolve: {
        extensions: ['.js', '.ts', '.tsx']
    }
}, {
    name: "editor",
    entry: {
        index: resolve(__dirname, "src/editor/index.ts"),
    },
    mode: "production",
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: [{
                loader: 'ts-loader',
                options: {
                    configFile: resolve(__dirname, "src/editor/tsconfig.json")
                }
            }],
        }, {
            test: /\.css$/,
            use: [CssExtract.loader, 'css-loader'],
        }, {
            test: /\.(vert|frag)$/,
            use: ['raw-loader'],
        }]
    },
    output: {
        filename: "[name]-[chunkhash:8].js",
        path: resolve(__dirname, "public/editor")
    },
    plugins: [
        new CssExtract({
            filename: "[name]-[contenthash:8].css",
        }),
        new Html({
            chunks: ['index'],
            filename: resolve(__dirname, "public/editor/index.html"),
            title: "rocked"
        }),
    ],
    resolve: {
        extensions: ['.js', '.ts', '.tsx']
    }
}];

module.exports = (_, argv) => {
    if (argv.mode === "development") {
        for (const c of config) {
            c.devtool = "source-map";
        }
    }

    return config;
}
