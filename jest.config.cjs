"use strict";

// eslint-disable-next-line n/no-extraneous-require
const { defaults } = require("jest-config");

/** @type {import('jest').Config} */
module.exports = {
  testMatch: [...defaults.testMatch, "**/test/*.js"],
  testPathIgnorePatterns: [
    ...defaults.testPathIgnorePatterns,
    "<rootDir>/test/",
    "<rootDir>/packages/test/",
  ],
  setupFilesAfterEnv: ["jest-extended/all"],
};
