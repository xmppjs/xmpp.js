import Connection from "@xmpp/connection-tcp";

class ConnectionTCP extends Connection {
  socketParameters(service) {
    const params = super.socketParameters(service);
    if (!params) return params;
    params.port = params.port || 5222;
    return params;
  }
}

ConnectionTCP.prototype.NS = "jabber:client";

export default ConnectionTCP;
