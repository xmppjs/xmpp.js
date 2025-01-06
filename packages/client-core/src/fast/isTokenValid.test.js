import { isTokenValid } from "./fast.js";
// eslint-disable-next-line n/no-extraneous-import
import { datetime } from "@xmpp/time";

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

it("returns false if the token.mechanism is not available", async () => {
  expect(
    isTokenValid(
      {
        expires: datetime(tomorrow),
        mechanism: "bar",
      },
      ["foo"],
    ),
  );
});

it("returns true if the token.mechanism is available", async () => {
  expect(
    isTokenValid({ expires: datetime(tomorrow), mechanism: "foo" }, ["foo"]),
  );
});

it("returns false if the token is expired", async () => {
  expect(
    isTokenValid(
      {
        expires: datetime(yesterday),
        mechanism: "foo",
      },
      ["foo"],
    ),
  );
});

it("returns true if the token is not expired", async () => {
  expect(
    isTokenValid(
      {
        expires: datetime(tomorrow),
        mechanism: "foo",
      },
      ["foo"],
    ),
  );
});
