export default {
  babel: {
    testOptions: {
      babelrc: false,
      plugins: [
        [
          "@babel/plugin-transform-react-jsx",
          {
            pragma: "xml",
            throwIfNamespace: false,
          },
        ],
        [
          "babel-plugin-jsx-pragmatic",
          {
            module: "@xmpp/xml",
            import: "xml",
          },
        ],
      ],
    },
  },
  // require: ["@babel/register/experimental-worker.js"],
  // workerThreads: false,
  // nodeArguments: ["--loader=babel-register-esm"],
  nodeArguments: ["--experimental-require-module"],
  files: [
    "packages/**/test.js",
    "packages/**/test/*.js",
    "packages/**/*.test.js",
    "!packages/test/*.js",
  ],
};
