import { EventEmitter } from "@xmpp/events";

import Connection from "../index.js";

test("rejects with TimeoutError if socket doesn't close", (done) => {
  expect.assertions(2);
  const conn = new Connection();
  conn.socket = new EventEmitter();
  conn.socket.end = () => {};
  conn._closeSocket().catch((err) => {
    expect(err.name).toBe("TimeoutError");
    done();
  });
  expect(conn.status).toBe("disconnecting");
});

test("resolves", (done) => {
  expect.assertions(3);
  const conn = new Connection();
  const sock = new EventEmitter();
  conn._attachSocket(sock);
  sock.emit("connect");
  sock.end = () => {};
  // eslint-disable-next-line promise/catch-or-return
  conn._closeSocket().then(() => {
    expect(conn.status).toBe("disconnect");
    return done();
  });
  expect(conn.status).toBe("disconnecting");
  sock.emit("close");
  expect(conn.status).toBe("disconnect");
});

test("rejects if socket.end throws", (done) => {
  expect.assertions(1);

  const error = new Error("foobar");

  const conn = new Connection();
  conn.socket = new EventEmitter();
  conn.socket.end = () => {
    throw error;
  };

  conn._closeSocket().catch((err) => {
    expect(err).toBe(error);
    done();
  });
});
