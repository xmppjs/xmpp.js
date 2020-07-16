export default {
  babel: {
    testOptions: {
      babelrc: false,
      plugins: [
        [
          "@babel/plugin-transform-react-jsx",
          {
            pragma: "xml",
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
    "packages/middleware/test/middleware.js",
  ],
};
