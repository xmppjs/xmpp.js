import Connection from "../index.js";
import { EventEmitter } from "@xmpp/events";

test("resolves if socket property is undefined", async () => {
  const conn = new Connection();
  conn.footerElement = () => <foo />;
  conn.socket = undefined;
  await conn.stop();
  expect().pass();
});

test("resolves if _closeStream rejects", async () => {
  const conn = new Connection();
  conn._closeStream = () => Promise.reject();
  conn._closeSocket = () => Promise.resolve();
  await conn.stop();
  expect().pass();
});

test("resolves if _closeSocket rejects", async () => {
  const conn = new Connection();
  conn._closeStream = () => Promise.resolve();
  conn._closeSocket = () => Promise.reject();
  await conn.stop();
  expect().pass();
});

test("resolves with the result of close", async () => {
  const conn = new Connection();
  conn.socket = {};
  const el = {};
  conn._closeStream = () => Promise.resolve(el);
  conn._closeSocket = () => Promise.resolve();
  expect(await conn.stop()).toBe(el);
});

test("does not throw if connection is not established", async () => {
  const conn = new Connection();
  await conn.stop();
  expect().pass();
});

// https://github.com/xmppjs/xmpp.js/issues/956
test("socket closes after timeout", (done) => {
  const conn = new Connection();
  conn.timeout = 100;

  const socket = new EventEmitter();
  socket.end = jest.fn(async () => {
    // Mock receiving "close" event after timeout
    setTimeout(() => {
      socket.emit("close");
    }, conn.timeout * 2);
  });
  conn._attachSocket(socket);

  const statuses = [conn.status];
  conn.on("status", (status) => {
    statuses.push(status);
  });

  conn.stop();

  // Wait a bit and assert that status is correct
  setTimeout(() => {
    expect(conn.status).toBe("offline");
    expect(conn.status).not.toBe("disconnect");
    done();
  }, conn.timeout * 3);
});
