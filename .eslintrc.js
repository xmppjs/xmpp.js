"use strict";

module.exports = {
  root: true,

  extends: [
    "eslint:recommended",
    "plugin:unicorn/recommended",
    "plugin:node/recommended",
    "plugin:promise/recommended",
    "plugin:prettier/recommended",
  ],

  env: {
    es6: true,
  },

  parserOptions: {
    sourceType: "script",
    ecmaVersion: 2019,
    ecmaFeatures: {
      jsx: true,
    },
  },

  rules: {
    strict: ["error", "global"],
    "no-empty": ["error", { allowEmptyCatch: true }],
    // "no-multi-assign": 0,
    "func-names": ["error", "as-needed"],
    "operator-linebreak": [
      "error",
      "after",
      { overrides: { "?": "before", ":": "before" } },
    ],
    "capitalized-comments": 0,
    "prefer-rest-params": ["error"],
    "prefer-spread": ["error"],
    "prefer-destructuring": [
      "error",
      {
        array: false,
        object: true,
      },
    ],
    "prefer-arrow-callback": ["error", { allowNamedFunctions: true }],

    // node
    // https://github.com/mysticatea/eslint-plugin-node
    "node/no-unpublished-require": 0, // doesn't play nice with monorepo
    "node/no-extraneous-require": [
      "error",
      { allowModules: ["ava", "sinon", "@xmpp/test"] },
    ],

    // promise
    // https://github.com/xjamundx/eslint-plugin-promise
    // promise/prefer-await-to-then: [error]
    // promise/prefer-await-to-callbacks: [error]
    // unicorn https://github.com/sindresorhus/eslint-plugin-unicorn

    // unicorn
    // https://github.com/sindresorhus/eslint-plugin-unicorn
    "unicorn/filename-case": 0,
    "unicorn/catch-error-name": ["error", { name: "err" }],
    "unicorn/prevent-abbreviations": 0,
    "unicorn/prefer-number-properties": 0,
    "unicorn/no-useless-undefined": 0,
    "unicorn/no-null": 0,
    "unicorn/prefer-module": 0,
    "unicorn/numeric-separators-style": 0, // Requires Node.js 12.8
  },
};
