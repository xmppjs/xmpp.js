"use strict";

const test = require("ava");
const { Component, xml } = require("..");

test("from attribute", (t) => {
  const entity = new Component();
  entity.jid = "test.foobar";
  entity.write = () => Promise.resolve();
  let el;

  el = xml("el");
  entity.send(el);
  t.is(el.attrs.from, undefined);

  el = xml("message");
  entity.send(el);
  t.is(el.attrs.from, "test.foobar");

  el = xml("el", { from: "bar" });
  entity.send(el);
  t.is(el.attrs.from, "bar");
});
