"use strict";

const tls = require("tls");
const net = require("net");
const { promise } = require("@xmpp/events");
const Socket = require("@xmpp/tls/lib/Socket");

function canUpgrade(socket) {
  return socket instanceof net.Socket && !(socket instanceof tls.TLSSocket);
}

module.exports.canUpgrade = canUpgrade;

async function upgrade(socket, options = {}) {
  const tlsSocket = new Socket();
  tlsSocket.connect({ socket, ...options });
  await promise(tlsSocket, "connect");

  return tlsSocket;
}

module.exports.upgrade = upgrade;
