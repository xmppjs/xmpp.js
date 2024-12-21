import JID from "../lib/JID.js";

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
