import { JID } from "@xmpp/test";

import Context from "../lib/IncomingContext.js";
import _Context from "../lib/Context.js";

test("is instance of Context", () => {
  const entity = { jid: new JID("foo@bar"), options: { domain: "bar" } };
  const ctx = new Context(entity, { attrs: {} });
  expect(ctx instanceof _Context).toBe(true);
});

test("sets the from property", () => {
  const entity = { jid: new JID("foo@bar"), options: { domain: "bar" } };
  const ctx = new Context(entity, { attrs: { from: "foo@bar" } });
  expect(ctx.from).toEqual(new JID("foo@bar"));
});

test("from property defaults to incoming stanza from attribute", () => {
  const entity = { jid: new JID("foo@bar"), options: { domain: "bar" } };
  const ctx = new Context(entity, { attrs: { from: "foo" } });
  expect(ctx.from).toEqual(new JID("foo"));
});

test("from property falls back to entity jid domain", () => {
  const entity = { jid: new JID("foo@bar"), options: { domain: "bar" } };
  const ctx = new Context(entity, { attrs: {} });
  expect(ctx.from).toEqual(new JID("bar"));
});

test("sets the to property", () => {
  const entity = { jid: new JID("foo@bar"), options: { domain: "bar" } };
  const ctx = new Context(entity, { attrs: { to: "foo@bar" } });
  expect(ctx.to).toEqual(new JID("foo@bar"));
});

test("to property defaults to incoming stanza to attribute", () => {
  const entity = { jid: new JID("foo@bar"), options: { domain: "bar" } };
  const ctx = new Context(entity, { attrs: { to: "hello" } });
  expect(ctx.to).toEqual(new JID("hello"));
});

test("sets the local property to from.local", () => {
  const entity = { jid: new JID("foo@bar"), options: { domain: "bar" } };
  const ctx = new Context(entity, { attrs: { from: "foo@bar" } });
  expect(ctx.local).toEqual("foo");
});

test("local property defaults to empty string", () => {
  const ctx = new Context({}, { attrs: { from: "bar" } });
  expect(ctx.local).toEqual("");
});

test("sets the domain property to from.domain", () => {
  const entity = { jid: new JID("foo@bar") };
  const ctx = new Context(entity, { attrs: { from: "foo@bar" } });
  expect(ctx.domain).toEqual("bar");
});

test("sets the resource property to from.resource", () => {
  const entity = { jid: new JID("foo@bar/test") };
  const ctx = new Context(entity, { attrs: { from: "foo@bar/test" } });
  expect(ctx.resource).toEqual("test");
});

test("resource property defaults to empty string", () => {
  const ctx = new Context({}, { attrs: { from: "foo@bar" } });
  expect(ctx.resource).toEqual("");
});
