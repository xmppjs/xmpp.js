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
  files: [
    "packages/**/test.js",
    "packages/**/test/*.js",
    "packages/**/*.test.js",
    "!packages/test/*.js",
  ],
};
