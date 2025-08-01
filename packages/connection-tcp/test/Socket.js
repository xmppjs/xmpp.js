import net from "node:net";

import Socket from "../Socket.js";

test("secure", () => {
  const socket = new Socket();
  expect(socket.secure).toBe(false);
});

test("instance of net.Socket", () => {
  const socket = new Socket();
  expect(socket).toBeInstanceOf(net.Socket);
});
