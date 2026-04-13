export function encode(string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(string);

  if (typeof bytes.toBase64 === "function") {
    return bytes.toBase64();
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return globalThis.btoa(binary);
}

export function decode(data) {
  const decoder = new TextDecoder();

  if (typeof Uint8Array.fromBase64 === "function") {
    return decoder.decode(Uint8Array.fromBase64(data));
  }

  const binary = globalThis.atob(data);
  const bytes = Uint8Array.from(binary, (c) => c.codePointAt(0));
  return decoder.decode(bytes);
}
