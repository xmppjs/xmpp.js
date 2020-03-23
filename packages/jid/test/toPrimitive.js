"use strict";

const test = require("ava");
const JID = require("../lib/JID");

/* eslint-disable no-implicit-coercion, eqeqeq */

test("cocerce to string", (t) => {
  const addr = new JID("foo", "bar");
  t.is(addr + "", addr.toString());
  t.is("" + addr, addr.toString());
  t.true(addr == addr.toString());
});

test("cocerce to NaN", (t) => {
  const addr = new JID("foo", "bar");
  t.true(isNaN(+addr));
  t.true(isNaN(addr + 4));
});
