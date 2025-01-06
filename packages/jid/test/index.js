import jid, { equal, JID } from "../index.js";

test("equal calls equals on the first argument with the second argument", () => {
  const A = jid("foo");
  const B = jid("bar");
  const spy_equals = jest.spyOn(A, "equals");
  equal(A, B);
  expect(spy_equals).toHaveBeenCalledWith(B);
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
