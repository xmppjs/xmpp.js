"use strict";

const test = require("ava");
const Context = require("../lib/Context");

test("sets the entity property", (t) => {
  const entity = {};
  const ctx = new Context(entity, { attrs: {} });
  t.is(ctx.entity, entity);
});

test("sets the stanza property", (t) => {
  const stanza = <presence />;
  const ctx = new Context({}, stanza);
  t.is(ctx.stanza, stanza);
});

test("sets name, id and type properties", (t) => {
  const stanza = <message id="foobar" type="whatever" />;
  const ctx = new Context({}, stanza);
  t.is(ctx.name, "message");
  t.is(ctx.id, "foobar");
  t.is(ctx.type, "whatever");
});

test("id property defaults to empty string", (t) => {
  const stanza = <message />;
  const ctx = new Context({}, stanza);
  t.is(ctx.id, "");
});

test("type property defaults to normal for message", (t) => {
  const stanza = <message />;
  const ctx = new Context({}, stanza);
  t.is(ctx.type, "normal");
});

test("type property defaults to available for presence", (t) => {
  const stanza = <presence />;
  const ctx = new Context({}, stanza);
  t.is(ctx.type, "available");
});

test("type property defaults to empty string for iq", (t) => {
  const stanza = <iq />;
  const ctx = new Context({}, stanza);
  t.is(ctx.type, "");
});

test("type property defaults to empty string for nonzas", (t) => {
  const stanza = <foobar />;
  const ctx = new Context({}, stanza);
  t.is(ctx.type, "");
});

test("to property is null", (t) => {
  const ctx = new Context({}, <foobar />);
  t.is(ctx.to, null);
});

test("from property is null", (t) => {
  const ctx = new Context({}, <foobar />);
  t.is(ctx.from, null);
});

test("local property is an empty string", (t) => {
  const ctx = new Context({}, <foobar />);
  t.is(ctx.local, "");
});

test("domain property is an empty string", (t) => {
  const ctx = new Context({}, <foobar />);
  t.is(ctx.domain, "");
});

test("resource property is an empty string", (t) => {
  const ctx = new Context({}, <foobar />);
  t.is(ctx.resource, "");
});
