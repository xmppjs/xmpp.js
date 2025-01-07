/* eslint-disable n/no-unsupported-features/node-builtins */

// https://datatracker.ietf.org/doc/draft-schmaus-kitten-sasl-ht/
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

export function Mechanism() {}

Mechanism.prototype.Mechanism = Mechanism;
Mechanism.prototype.name = "HT-SHA-256-NONE";
Mechanism.prototype.clientFirst = true;

Mechanism.prototype.response = async function response({ username, password }) {
  this.key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    // https://developer.mozilla.org/en-US/docs/Web/API/HmacImportParams
    { name: "HMAC", hash: "SHA-256" },
    false, // extractable
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    this.key,
    new TextEncoder().encode("Initiator"),
  );
  return `${username}\0${String.fromCodePoint(...new Uint8Array(signature))}`;
};

Mechanism.prototype.final = async function final(data) {
  const signature = Uint8Array.from(data, (c) => c.codePointAt(0));
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/verify
  const result = await crypto.subtle.verify(
    "HMAC",
    this.key,
    signature,
    new TextEncoder().encode("Responder"),
  );
  if (result !== true) {
    throw new Error("Responder message from server was wrong");
  }
};

export default function saslHashedToken(sasl) {
  sasl.use(Mechanism);
}
