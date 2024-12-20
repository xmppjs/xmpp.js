"use strict";

const Context = require("../lib/OutgoingContext");
const { JID } = require("@xmpp/test");
const _Context = require("../lib/Context");

test("is instance of Context", () => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: {} });
  expect(ctx instanceof _Context).toBe(true);
});

test("sets the from property", () => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: { from: "foo@bar" } });
  expect(ctx.from).toEqual(new JID("foo@bar"));
});

test("from property default to entity jid", () => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: {} });
  expect(ctx.from).toEqual(new JID("foo@bar"));
});

test("sets the to property", () => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: { to: "foo@bar" } });
  expect(ctx.to).toEqual(new JID("foo@bar"));
});

test("to property default to entity jid domain", () => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: {} });
  expect(ctx.to).toEqual(new JID("bar"));
});

test("sets the local property to to.local", () => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: { to: "foo@bar" } });
  expect(ctx.local).toEqual("foo");
});

test("local property defaults to empty string", () => {
  const ctx = new Context({}, { attrs: { to: "bar" } });
  expect(ctx.local).toEqual("");
});

test("sets the domain property to to.domain", () => {
  const entity = { jid: new JID("foo@bar") };
  const ctx = new Context(entity, { attrs: { to: "foo@bar" } });
  expect(ctx.domain).toEqual("bar");
});

test("sets the resource property to to.resource", () => {
  const entity = { jid: new JID("foo@bar/test") };
  const ctx = new Context(entity, { attrs: { to: "foo@bar/test" } });
  expect(ctx.resource).toEqual("test");
});

test("resource property defaults to empty string", () => {
  const ctx = new Context({}, { attrs: { to: "foo@bar" } });
  expect(ctx.resource).toEqual("");
});
