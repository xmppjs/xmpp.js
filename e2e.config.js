export default {
  failFast: true,
  serial: true,
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
  nodeArguments: ["--experimental-require-module"],
  files: ["test/*.js"],
};
