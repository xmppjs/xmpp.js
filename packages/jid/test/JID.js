"use strict";

const JID = require("../lib/JID");

test("throws TypeError for invalid domain", () => {
  expect(() => new JID("foo")).toThrow(new TypeError("Invalid domain."));

  expect(() => new JID()).toThrow(new TypeError("Invalid domain."));

  expect(() => new JID("foo", "", "r")).toThrow(
    new TypeError("Invalid domain."),
  );

  expect(() => new JID("foo", "", "r")).toThrow(
    new TypeError("Invalid domain."),
  );
});
