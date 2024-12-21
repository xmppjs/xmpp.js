"use strict";

module.exports = function config(api) {
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
    presets: [["@babel/preset-env"]],
    plugins: ["@babel/plugin-transform-runtime"],
  };
};
