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
    false, //extractable
    ["sign", "verify"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    this.key,
    new TextEncoder().encode("Initiator"),
  );
  const digestS = String.fromCodePoint(...new Uint8Array(digest));
  return username + "\0" + digestS;
};

Mechanism.prototype.final = async function final(data) {
  const digest = await crypto.subtle.sign(
    "HMAC",
    this.key,
    new TextEncoder().encode("Responder"),
  );
  const digestS = String.fromCodePoint(...new Uint8Array(digest));
  if (digestS !== data) {
    throw new Error("Responder message from server was wrong");
  }
};

export default function saslHashedToken(sasl) {
  sasl.use(Mechanism);
}
