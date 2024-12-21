export function encode(string) {
  return globalThis.btoa(string);
}

export function decode(string) {
  return globalThis.atob(string);
}
