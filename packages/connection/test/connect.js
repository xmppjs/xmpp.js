"use strict";

const test = require("ava");
const Connection = require("..");
const { EventEmitter, promise } = require("@xmpp/events");

function socket(fn) {
  return class Socket extends EventEmitter {
    async connect() {
      await Promise.resolve();
      return fn.call(this);
    }
  };
}

test('emits "connecting" status', (t) => {
  const conn = new Connection();
  // eslint-disable-next-line func-names
  conn.Socket = socket(function () {
    this.emit("connect");
  });

  return Promise.all([
    promise(conn, "connecting"),
    promise(conn, "status").then((status) => t.is(status, "connecting")),
    conn.connect("url"),
  ]);
});

test("rejects if an error is emitted before connected", async (t) => {
  const conn = new Connection();
  const error = {};

  // eslint-disable-next-line func-names
  conn.Socket = socket(function () {
    this.emit("error", error);
  });
  conn.on("error", (err) => t.is(err, error));

  try {
    await conn.connect("url");
  } catch (err) {
    t.is(err, error);
  }
});

test("resolves if socket connects", async (t) => {
  const conn = new Connection();
  // eslint-disable-next-line func-names
  conn.Socket = socket(function () {
    this.emit("connect");
  });
  await conn.connect("url");
  t.pass();
});
