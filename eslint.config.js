// eslint-disable-next-line n/no-extraneous-import
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import eslintNodePlugin from "eslint-plugin-n";
import pluginPromise from "eslint-plugin-promise";
import pluginJest from "eslint-plugin-jest";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["**/dist/*.js", "eslint.config.mjs"],
  },
  js.configs.recommended,
  eslintPluginUnicorn.configs["recommended"],
  eslintNodePlugin.configs["flat/recommended-script"],
  pluginPromise.configs["flat/recommended"],
  importPlugin.flatConfigs.errors,
  //  importPlugin.flatConfigs.recommended,
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
      // "no-multi-assign": "off",
      "func-names": ["error", "as-needed"],
      "operator-linebreak": [
        "error",
        "after",
        { overrides: { "?": "before", ":": "before" } },
      ],
      "capitalized-comments": "off",
      "prefer-rest-params": ["error"],
      "prefer-spread": ["error"],
      "prefer-object-spread": ["error"],
      "prefer-destructuring": [
        "error",
        {
          array: false,
          object: true,
        },
      ],
      "prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
      "no-redeclare": ["error", { builtinGlobals: false }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": ["error"],

      // node
      // https://github.com/eslint-community/eslint-plugin-n/
      "n/no-unpublished-require": "off", // doesn't play nice with monorepo
      "n/hashbang": "off",

      // promise
      // https://github.com/xjamundx/eslint-plugin-promise
      "promise/prefer-await-to-then": "off",
      "promise/prefer-await-to-callbacks": "off",

      // unicorn
      // https://github.com/sindresorhus/eslint-plugin-unicorn
      "unicorn/filename-case": "off",
      "unicorn/catch-error-name": ["error", { name: "err" }],
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-useless-undefined": "off",
      "unicorn/no-null": "off",
      "unicorn/prefer-event-target": "off",
      // "unicorn/prefer-top-level-await": "off",
      "unicorn/prefer-node-protocol": "off",
      "unicorn/prefer-export-from": "off",

      // import
      // https://github.com/import-js/eslint-plugin-import/
      "import/enforce-node-protocol-usage": ["error", "always"],
      "import/order": ["error", { "newlines-between": "always" }],
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },
  {
    files: ["**/*.spec.js", "**/*.test.js", "**/test.js", "**/test/**.js"],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      ...pluginJest.configs["flat/style"].rules,
      ...pluginJest.configs["flat/recommended"].rules,
      "jest/no-done-callback": "off",
      "jest/prefer-to-be": "off",
      "jest/no-conditional-expect": "off",
      // https://github.com/jest-community/eslint-plugin-jest/pull/1688
      "jest/valid-expect": "off",
      // "jest/valid-expect": [
      //   "error",
      //   {
      //     alwaysAwait: true,
      //     // For jest-extended expect().pass
      //     minArgs: "off",
      //   },
      // ],
      "promise/no-callback-in-promise": "off",
      // "n/no-extraneous-require": ["error", { allowModules: ["@xmpp/test"] }],
      "n/no-extraneous-import": [
        "error",
        {
          allowModules: [
            "@xmpp/test",
            "@xmpp/time",
            "@xmpp/xml",
            "@xmpp/connection",
            "@xmpp/websocket",
            "selfsigned",
            "@xmpp/events",
          ],
        },
      ],
    },
  },
];
