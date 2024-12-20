"use strict";

const tls = require("tls");
const { canUpgrade } = require("./starttls");
const net = require("net");
const WebSocket = require("../websocket/lib/Socket");

test("canUpgrade", () => {
  expect(canUpgrade(new WebSocket())).toBe(false);
  expect(canUpgrade(new tls.TLSSocket())).toBe(false);
  expect(canUpgrade(new net.Socket())).toBe(true);
});
