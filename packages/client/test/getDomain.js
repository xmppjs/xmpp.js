"use strict";

const test = require("ava");
const getDomain = require("../lib/getDomain");

test("getDomain", (t) => {
  t.is(getDomain("ws://foo:123/foobar"), "foo");
  t.is(getDomain("ws://123.156.123.5:123/foobar"), "123.156.123.5");
  t.is(getDomain("xmpp://foo:123/foobar"), "foo");
  t.is(getDomain("foo"), "foo");
  t.is(getDomain("foo:123"), "foo");
  t.is(getDomain("foo:123/foobar"), "foo");
});
