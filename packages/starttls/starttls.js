import tls from "node:tls";
import net from "node:net";

import { promise } from "@xmpp/events";
import Socket from "@xmpp/tls/lib/Socket.js";

export function canUpgrade(socket) {
  return socket instanceof net.Socket && !(socket instanceof tls.TLSSocket);
}

export async function upgrade(socket, options = {}) {
  const tlsSocket = new Socket();
  tlsSocket.connect({ socket, ...options });
  await promise(tlsSocket, "connect");

  return tlsSocket;
}
