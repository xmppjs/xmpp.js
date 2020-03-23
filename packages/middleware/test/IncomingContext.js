"use strict";

const test = require("ava");
const Context = require("../lib/IncomingContext");
const { JID } = require("@xmpp/test");
const _Context = require("../lib/Context");

test("is instance of Context", (t) => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: {} });
  t.true(ctx instanceof _Context);
});

test("sets the from property", (t) => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: { from: "foo@bar" } });
  t.deepEqual(ctx.from, new JID("foo@bar"));
});

test("from property default to entity jid domain", (t) => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: {} });
  t.deepEqual(ctx.from, new JID("bar"));
});

test("sets the to property", (t) => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: { to: "foo@bar" } });
  t.deepEqual(ctx.to, new JID("foo@bar"));
});

test("to property default to entity jid", (t) => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: {} });
  t.deepEqual(ctx.to, new JID("foo@bar"));
});

test("sets the local property to from.local", (t) => {
  const entity = { jid: new JID("foo@bar"), domain: "bar" };
  const ctx = new Context(entity, { attrs: { from: "foo@bar" } });
  t.deepEqual(ctx.local, "foo");
});

test("local property defaults to empty string", (t) => {
  const ctx = new Context({}, { attrs: { from: "bar" } });
  t.deepEqual(ctx.local, "");
});

test("sets the domain property to from.domain", (t) => {
  const entity = { jid: new JID("foo@bar") };
  const ctx = new Context(entity, { attrs: { from: "foo@bar" } });
  t.deepEqual(ctx.domain, "bar");
});

test("sets the resource property to from.resource", (t) => {
  const entity = { jid: new JID("foo@bar/test") };
  const ctx = new Context(entity, { attrs: { from: "foo@bar/test" } });
  t.deepEqual(ctx.resource, "test");
});

test("resource property defaults to empty string", (t) => {
  const ctx = new Context({}, { attrs: { from: "foo@bar" } });
  t.deepEqual(ctx.resource, "");
});
