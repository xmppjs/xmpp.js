"use strict";

/** @type {import('jest').Config} */
module.exports = {
  testMatch: ["<rootDir>/test/*.test.js"],
  setupFilesAfterEnv: ["jest-extended/all"],
  testTimeout: 10 * 1000,
};
