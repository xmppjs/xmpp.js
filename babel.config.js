"use strict";

module.exports = (api) => {
  const isTest = api.env("test");

  if (isTest) {
    return {
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
        "@babel/plugin-transform-modules-commonjs",
      ],
    };
  }

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: {
            ie: "10",
          },
          loose: true,
        },
      ],
    ],
    plugins: [
      "@babel/plugin-transform-runtime",
      "babel-plugin-transform-async-to-promises",
      "@babel/plugin-proposal-object-rest-spread",
    ],
  };
};
