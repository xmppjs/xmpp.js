"use strict";

const xml = require("@xmpp/xml");
const test = require("ava");
const Connection = require("..");

test("single element", (t) => {
  t.plan(3);
  const conn = new Connection();
  conn.root = xml("root");

  const foo = xml("foo");

  conn.socket = {
    write(str) {
      t.is(str, "<foo/>");
    },
  };

  t.is(foo.attrs.parent, undefined);

  conn.send(foo);

  t.is(foo.parent, conn.root);

  conn.on("send", (element) => {
    t.is(element, foo);
  });
});

test("multiple elements", (t) => {
  t.plan(1);
  const conn = new Connection();
  conn.root = xml("root");

  const foo = xml("foo");
  const bar = xml("bar");

  conn.socket = {
    write(str) {
      t.is(str, "<foo/><bar/>");
    },
  };

  conn.send(foo, bar);
});
