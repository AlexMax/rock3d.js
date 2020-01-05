import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { string } from "rollup-plugin-string";
import typescript from "rollup-plugin-typescript2";
import html from "@rollup/plugin-html";

export default {
    input: "src/client/index.ts",
    output: [{
        dir: "public/client",
        entryFileNames: "[name].[hash].js",
        format: "iife",
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
            objectHashIgnoreUnknownHack: true, // needed by html plugin
        }),
        html({
            title: "rock3d.js client",
        })
    ]
};