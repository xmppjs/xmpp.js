import { EventEmitter } from "@xmpp/events";

import Socket from "../lib/Socket.js";

// eslint-disable-next-line n/no-unsupported-features/node-builtins
globalThis.WebSocket = EventEmitter;

test("secure", () => {
  const socket = new Socket();

  expect(socket.secure).toBe(false);

  socket.connect("ws://example.com/foo");
  expect(socket.secure).toBe(false);

  socket.connect("ws://localhost/foo");
  expect(socket.secure).toBe(true);

  socket.connect("ws://127.0.0.1/foo");
  expect(socket.secure).toBe(true);

  socket.connect("ws://[::1]/foo");
  expect(socket.secure).toBe(true);

  socket.connect("wss://example.com/foo");
  expect(socket.secure).toBe(true);

  socket.socket.emit("close", { wasClean: Math.random > 0.5 });
  expect(socket.secure).toBe(false);
});
