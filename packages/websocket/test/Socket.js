import Socket from "../lib/Socket.js";

test("isSecure", () => {
  const socket = new Socket();
  expect(socket.isSecure()).toBe(false);

  socket.url = "ws://example.com/foo";
  expect(socket.isSecure()).toBe(false);

  socket.url = "ws://localhost/foo";
  expect(socket.isSecure()).toBe(true);

  socket.url = "ws://127.0.0.1/foo";
  expect(socket.isSecure()).toBe(true);

  socket.url = "ws://[::1]/foo";
  expect(socket.isSecure()).toBe(true);

  socket.url = "wss://example.com/foo";
  expect(socket.isSecure()).toBe(true);
});
