import { parseURI } from "@xmpp/connection/lib/util.js";
import ConnectionTCP from "@xmpp/connection-tcp";

import Socket from "./Socket.js";

class ConnectionTLS extends ConnectionTCP {
  socketParameters(service) {
    const { port, hostname, protocol } = parseURI(service);
    return protocol === "xmpps:"
      ? {
          port: Number(port) || 5223,
          host: hostname,
        }
      : undefined;
  }
}

ConnectionTLS.prototype.Socket = Socket;
ConnectionTLS.prototype.NS = "jabber:client";

export default ConnectionTLS;
