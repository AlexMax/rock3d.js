import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { string } from "rollup-plugin-string";
import typescript from "rollup-plugin-typescript2";

export default {
    input: "src/client/index.ts",
    output: [{
        file: "public/dist/client.js",
        format: "iife",
        name: "client",
        sourcemap: true
    }],
    plugins: [
        resolve(),
        commonjs(),
        string({
            include: ["src/**/*.vert", "src/**/*.frag"]
        }),
        typescript({
            tsconfig: "src/client/tsconfig.json",
        })
    ]
};