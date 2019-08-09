const path = require('path');

module.exports = {
    entry: './src/index.ts',
    mode: "production",
    module: {
        rules: [{
            exclude: /node_modules/,
            test: /\.ts$/,
            use: 'ts-loader'
        }]
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'public/dist')
    },
    resolve: {
        extensions: ['.js', '.ts']
    }
};
