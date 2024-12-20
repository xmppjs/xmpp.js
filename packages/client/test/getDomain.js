import test from "ava";
import getDomain from "../lib/getDomain.js";

test("getDomain", (t) => {
  t.is(getDomain("ws://foo:123/foobar"), "foo");
  t.is(getDomain("ws://123.156.123.5:123/foobar"), "123.156.123.5");
  t.is(getDomain("xmpp://foo:123/foobar"), "foo");
  t.is(getDomain("foo"), "foo");
  t.is(getDomain("foo:123"), "foo");
  t.is(getDomain("foo:123/foobar"), "foo");
});
