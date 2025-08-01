import { EventEmitter, promise } from "@xmpp/events";

import Connection from "../index.js";

function socket(fn) {
  return class Socket extends EventEmitter {
    async connect() {
      await Promise.resolve();
      return fn.call(this);
    }
  };
}

test('emits "connecting" status', () => {
  const conn = new Connection();
  // eslint-disable-next-line func-names
  conn.Socket = socket(function () {
    this.emit("connect");
  });

  return Promise.all([
    promise(conn, "connecting"),
    promise(conn, "status").then((status) => expect(status).toBe("connecting")),
    conn.connect("url"),
  ]);
});

test("rejects if an error is emitted before connected", async () => {
  expect.assertions(2);

  const conn = new Connection();
  const error = {};

  // eslint-disable-next-line func-names
  conn.Socket = socket(function () {
    this.emit("error", error);
  });
  conn.on("error", (err) => {
    expect(err).toBe(error);
  });

  try {
    await conn.connect("url");
    expect.fail();
  } catch (err) {
    expect(err).toBe(error);
  }
});

test("resolves if socket connects", async () => {
  const conn = new Connection();
  // eslint-disable-next-line func-names
  conn.Socket = socket(function () {
    this.emit("connect");
  });
  await conn.connect("url");
  expect().pass();
});
