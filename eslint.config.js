import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintNodePlugin from "eslint-plugin-n";
import pluginPromise from "eslint-plugin-promise";

export default [
  {
    ignores: [
      "**/dist/*.js",
      "bundle.js",
      "packages/xmpp.js/index.js",
      "ava.config.js",
      "e2e.config.js",
      "eslint.config.mjs",
    ],
  },
  js.configs.recommended,
  eslintPluginUnicorn.configs["flat/recommended"],
  eslintNodePlugin.configs["flat/recommended-script"],
  pluginPromise.configs["flat/recommended"],
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.builtin,
        ...globals["shared-node-browser"],
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      sourceType: "module",
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
      "no-redeclare": ["error", { builtinGlobals: false }],

      // node
      // https://github.com/eslint-community/eslint-plugin-n/
      "n/no-unpublished-require": 0, // doesn't play nice with monorepo
      "n/no-extraneous-require": [
        "error",
        { allowModules: ["ava", "sinon", "@xmpp/test"] },
      ],
      "n/no-extraneous-import": [
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
      "unicorn/prefer-event-target": 0,
      "unicorn/prefer-top-level-await": 0,
      "unicorn/prefer-node-protocol": 0,
    },
  },
  {
    files: ["server/ctl.js"],
    rules: {
      "n/no-unsupported-features/es-syntax": "off",
      "n/no-unsupported-features/es-syntax": "off",
    },
  },
];
