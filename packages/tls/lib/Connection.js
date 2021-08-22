"use strict";

const { parseURI } = require("@xmpp/connection/lib/util");
const ConnectionTCP = require("@xmpp/connection-tcp");
const Socket = require("./Socket.js");

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

module.exports = ConnectionTLS;
