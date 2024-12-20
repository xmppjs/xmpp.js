/* eslint-disable n/no-unsupported-features/node-builtins */

export function encode(string) {
  return globalThis.btoa(string);
}

export function decode(string) {
  return globalThis.atob(string);
}
