import net from "node:net";
import Socket from "../Socket.js";

test("isSecure()", () => {
  const socket = new Socket();
  expect(socket.isSecure()).toBe(false);
});

test("instance of net.Socket", () => {
  const socket = new Socket();
  expect(socket).toBeInstanceOf(net.Socket);
});
