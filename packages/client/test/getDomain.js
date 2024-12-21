import getDomain from "../lib/getDomain.js";

test("getDomain", () => {
  expect(getDomain("ws://foo:123/foobar")).toBe("foo");
  expect(getDomain("ws://123.156.123.5:123/foobar")).toBe("123.156.123.5");
  expect(getDomain("xmpp://foo:123/foobar")).toBe("foo");
  expect(getDomain("foo")).toBe("foo");
  expect(getDomain("foo:123")).toBe("foo");
  expect(getDomain("foo:123/foobar")).toBe("foo");
});
