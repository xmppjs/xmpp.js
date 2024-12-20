"use strict";

const JID = require("../lib/JID");

test("throws TypeError for invalid domain", () => {
  expect(() => new JID("foo")).toThrowError(new TypeError("Invalid domain."));

  expect(() => new JID()).toThrowError(new TypeError("Invalid domain."));

  expect(() => new JID("foo", "", "r")).toThrowError(
    new TypeError("Invalid domain."),
  );

  expect(() => new JID("foo", "", "r")).toThrowError(
    new TypeError("Invalid domain."),
  );
});
