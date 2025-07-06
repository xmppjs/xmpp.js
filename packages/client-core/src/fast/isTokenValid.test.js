import { datetime } from "@xmpp/time";

import { isTokenValid } from "./fast.js";

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

it("returns false if the token.mechanism is not available", async () => {
  expect(
    isTokenValid(
      {
        expiry: datetime(tomorrow),
        mechanism: "bar",
      },
      ["foo"],
    ),
  ).toBe(false);
});

it("returns true if the token.mechanism is available", async () => {
  expect(
    isTokenValid({ expiry: datetime(tomorrow), mechanism: "foo" }, ["foo"]),
  ).toBe(true);
});

it("returns false if the token is expired", async () => {
  expect(
    isTokenValid(
      {
        expiry: datetime(yesterday),
        mechanism: "foo",
      },
      ["foo"],
    ),
  ).toBe(false);
});

it("returns true if the token is not expired", async () => {
  expect(
    isTokenValid(
      {
        expiry: datetime(tomorrow),
        mechanism: "foo",
      },
      ["foo"],
    ),
  ).toBe(true);
});

it("returns false if the token is nullish", async () => {
  expect(isTokenValid(null)).toBe(false);
  expect(isTokenValid(undefined)).toBe(false);
});
