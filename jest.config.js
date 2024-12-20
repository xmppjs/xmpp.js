"use strict";

const { defaults } = require("jest-config");

/** @type {import('jest').Config} */
const config = {
  testMatch: [...defaults.testMatch, "**/test/*.js"],
  testPathIgnorePatterns: [
    ...defaults.testPathIgnorePatterns,
    "<rootDir>/test/",
    "<rootDir>/packages/test/",
  ],
};

module.exports = config;
