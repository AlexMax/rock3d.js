import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { string } from "rollup-plugin-string";
import typescript from "rollup-plugin-typescript2";

export default {
    input: "src/editor/index.ts",
    output: [{
        file: "public/dist/editor.js",
        format: "umd",
        name: "editor",
        sourcemap: true
    }],
    plugins: [
        resolve(),
        commonjs(),
        string({
            include: ["src/**/*.vert", "src/**/*.frag"]
        }),
        typescript({
            tsconfig: "src/editor/tsconfig.json",
        })
    ]
};