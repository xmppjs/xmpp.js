import { getMechanism } from "../lib/createOnAuthenticate.js";

it("returns ANONYMOUS if available and there are no credentials", () => {
  expect(
    getMechanism({
      credentials: {},
      mechanisms: ["PLAIN", "ANONYMOUS"],
    }),
  ).toBe("ANONYMOUS");
});

it("returns the first mechanism if the connection is secure", () => {
  expect(
    getMechanism({
      credentials: { username: "foo", password: "bar" },
      mechanisms: ["PLAIN", "SCRAM-SHA-1"],
      entity: { isSecure: () => true },
    }),
  ).toBe("PLAIN");
});

it("does not return PLAIN if the connection is not secure", () => {
  expect(
    getMechanism({
      credentials: { username: "foo", password: "bar" },
      mechanisms: ["PLAIN", "SCRAM-SHA-1"],
      entity: { isSecure: () => false },
    }),
  ).toBe("SCRAM-SHA-1");

  expect(
    getMechanism({
      credentials: { username: "foo", password: "bar" },
      mechanisms: ["PLAIN"],
      entity: { isSecure: () => false },
    }),
  ).toBe(undefined);
});
