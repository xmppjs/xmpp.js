import Connection from "../index.js";

test("resolves if socket property is undefined", async () => {
  const conn = new Connection();
  conn.footerElement = () => <foo />;
  conn.socket = undefined;
  await conn.stop();
  expect().pass();
});

test("resolves if close rejects", async () => {
  const conn = new Connection();
  conn.close = () => Promise.reject();
  conn.disconnect = () => Promise.resolve();
  await conn.stop();
  expect().pass();
});

test("resolves if disconnect rejects", async () => {
  const conn = new Connection();
  conn.disconnect = () => Promise.reject();
  conn.close = () => Promise.resolve();
  await conn.stop();
  expect().pass();
});

test("resolves with the result of close", async () => {
  const conn = new Connection();
  conn.socket = {};
  const el = {};
  conn.close = () => Promise.resolve(el);
  conn.disconnect = () => Promise.resolve();
  expect(await conn.stop()).toBe(el);
});

test("does not throw if connection is not established", async () => {
  const conn = new Connection();
  await conn.stop();
  expect().pass();
});
