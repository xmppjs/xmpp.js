"use strict";

const { spy } = require("sinon");
const jid = require("..");
const JID = require("../lib/JID");

test("equal calls equals on the first argument with the second argument", () => {
  const A = jid("foo");
  const B = jid("bar");
  spy(A, "equals");
  jid.equal(A, B);
  expect(A.equals.calledWith(B)).toBe(true);
  A.equals.restore();
});

test("JID exports lib/JID", () => {
  expect(jid.JID).toBe(JID);
});

test("calls parse if only first argument provided", () => {
  const addr = jid("foo@bar");
  expect(addr instanceof JID).toBe(true);
  expect(addr.toString()).toBe("foo@bar");
});

test("calls JID with passed arguments", () => {
  const addr = jid("foo", "bar", "baz");
  expect(addr instanceof JID).toBe(true);
  expect(addr.toString()).toBe("foo@bar/baz");
});

test("works as expected with new operator", () => {
  const addr = new jid("foo", "bar", "baz");
  expect(addr instanceof JID).toBe(true);
  expect(addr.toString()).toBe("foo@bar/baz");
});
