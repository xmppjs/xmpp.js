"use strict";

const test = require("ava");
const Connection = require("..");

test("resolves if socket property is undefined", async (t) => {
  const conn = new Connection();
  conn.footerElement = () => <foo />;
  conn.socket = undefined;
  await conn.stop();
  t.pass();
});

test("resolves if close rejects", async (t) => {
  const conn = new Connection();
  conn.close = () => Promise.reject();
  conn.disconnect = () => Promise.resolve();
  await conn.stop();
  t.pass();
});

test("resolves if disconnect rejects", async (t) => {
  const conn = new Connection();
  conn.disconnect = () => Promise.reject();
  conn.close = () => Promise.resolve();
  await conn.stop();
  t.pass();
});

test("resolves with the result of close", async (t) => {
  const conn = new Connection();
  conn.socket = {};
  const el = {};
  conn.close = () => Promise.resolve(el);
  conn.disconnect = () => Promise.resolve();
  t.is(await conn.stop(), el);
});

test("does not throw if connection is not established", async (t) => {
  const conn = new Connection();
  await t.notThrowsAsync(conn.stop());
});
