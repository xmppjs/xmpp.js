// https://datatracker.ietf.org/doc/draft-schmaus-kitten-sasl-ht/

export function Mechanism() {}

Mechanism.prototype.Mechanism = Mechanism;
Mechanism.prototype.name = "HT-SHA-256-NONE";
Mechanism.prototype.clientFirst = true;

Mechanism.prototype.response = async function response(cred) {
  this.password = cred.password;
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const hmac = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(this.password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const digest = await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode("Initiator"));
  const digestS = String.fromCharCode.apply(null, new Uint8Array(digest));
  return cred.username + "\0" + digestS;
};

Mechanism.prototype.final = async function final(data) {
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const hmac = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(this.password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const digest = await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode("Responder"));
  const digestS = String.fromCharCode.apply(null, new Uint8Array(digest));
  if (digestS !== data) {
    throw new Error("Responder message from server was wrong");
  }
};

export default function saslHashedToken(sasl) {
  sasl.use(Mechanism);
}
