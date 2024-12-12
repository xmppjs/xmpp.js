/* eslint-disable n/no-unsupported-features/node-builtins */
"use strict";

module.exports.encode = function encode(string) {
  return globalThis.btoa(string);
};

module.exports.decode = function decode(string) {
  return globalThis.atob(string);
};
