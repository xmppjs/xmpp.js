import { EventEmitter } from "@xmpp/events";

import Connection from "../index.js";

test("stop", async () => {
  const conn = new Connection();

  const close_el = {};
  const spy_disconnect = jest
    .spyOn(conn, "disconnect")
    .mockImplementation(async () => {
      return close_el;
    });
  const spy_status = jest.spyOn(conn, "_status");

  conn.status = "online";

  await conn.stop();

  expect(spy_disconnect).toHaveBeenCalledTimes(1);
  expect(spy_status).toHaveBeenCalledTimes(1);
  expect(spy_status).toHaveBeenCalledWith("offline", close_el);
  expect(conn.status).toBe("offline");
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
