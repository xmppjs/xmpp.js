"use strict";

const { Component, xml } = require("..");

test("from attribute", () => {
  const entity = new Component();
  entity.jid = "test.foobar";
  entity.write = () => Promise.resolve();
  let el;

  el = xml("el");
  entity.send(el);
  expect(el.attrs.from).toBe(undefined);

  el = xml("message");
  entity.send(el);
  expect(el.attrs.from).toBe("test.foobar");

  el = xml("el", { from: "bar" });
  entity.send(el);
  expect(el.attrs.from).toBe("bar");
});
