const { resolve } = require('path');
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
            test: /\.(vert|frag)$/,
            use: ['raw-loader'],
        }]
    },
    output: {
        filename: "[name]-[chunkhash:8].js",
        path: resolve(__dirname, "public/client")
    },
    plugins: [
        new Html({
            chunks: ['index'],
            filename: resolve(__dirname, "public/client/index.html")
        }),
        new Html({
            chunks: ['demoIndex'],
            filename: resolve(__dirname, "public/client/demoIndex.html")
        })
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
