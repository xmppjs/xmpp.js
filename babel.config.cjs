module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          ie: "11",
        },
        loose: true,
      },
    ],
  ],
  plugins: [
    "@babel/plugin-transform-runtime",
    "babel-plugin-transform-async-to-promises",
    "@babel/plugin-proposal-object-rest-spread",

    //   [
    //     "@babel/plugin-transform-react-jsx",
    //     {
    //       pragma: "xml",
    //       throwIfNamespace: false,
    //     },
    //   ],
    //   [
    //     "babel-plugin-jsx-pragmatic",
    //     {
    //       module: "@xmpp/xml",
    //       import: "xml",
    //     },
    //   ],
  ],
};
