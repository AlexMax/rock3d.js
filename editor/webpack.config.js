const path = require('path');

module.exports = {
    entry: './src/index.ts',
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
        }]
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'public/dist'),
        publicPath: '/dist/'
    },
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx']
    }
};
