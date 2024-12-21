import tls from "tls";
import { canUpgrade } from "./starttls.js";
import net from "net";
// eslint-disable-next-line n/no-extraneous-import
import WebSocket from "@xmpp/websocket/lib/Socket.js";

test("canUpgrade", () => {
  expect(canUpgrade(new WebSocket())).toBe(false);
  expect(canUpgrade(new tls.TLSSocket())).toBe(false);
  expect(canUpgrade(new net.Socket())).toBe(true);
});
