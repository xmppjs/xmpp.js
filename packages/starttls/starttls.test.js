import tls from "node:tls";
import net from "node:net";

import WebSocket from "@xmpp/websocket/lib/Socket.js";

import { canUpgrade } from "./starttls.js";

test("canUpgrade", () => {
  expect(canUpgrade(new WebSocket())).toBe(false);
  expect(canUpgrade(new tls.TLSSocket())).toBe(false);
  expect(canUpgrade(new net.Socket())).toBe(true);
});
