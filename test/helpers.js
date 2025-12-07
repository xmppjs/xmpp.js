import selfsigned from "selfsigned";

export async function makeSelfSignedCertificate() {
  const attrs = [{ name: "commonName", value: "localhost" }];
  const pem = await selfsigned.generate(attrs, {
    algorithm: "sha256",
    days: 365,
    keySize: 2048,
  });
  return pem;
}
