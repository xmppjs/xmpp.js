import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import nodePolyfills from "rollup-plugin-node-polyfills";
import terser from "@rollup/plugin-terser";

export default [
  {
    input: "packages/client/index.js",
    output: {
      file: "packages/client/dist/xmpp.js",
      format: "iife",
      sourcemap: true,
      name: "XMPP",
    },
    plugins: [
      terser(),
      babel({ babelHelpers: "runtime" }),
      nodePolyfills(),
      nodeResolve({ preferBuiltins: false, browser: true }),
      commonjs(),
    ],
  },
  {
    input: "packages/client/index.js",
    output: {
      file: "packages/client/dist/xmpp.min.js",
      format: "iife",
      sourcemap: true,
      compact: true,
      name: "XMPP",
    },
    plugins: [
      terser(),
      babel({ babelHelpers: "runtime" }),
      nodePolyfills(),
      nodeResolve({ preferBuiltins: false, browser: true }),
      commonjs(),
    ],
  },
];
