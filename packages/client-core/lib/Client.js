"use strict";

const Connection = require("@xmpp/connection");

class Client extends Connection {
  constructor(options) {
    super(options);
    this.transports = [];
  }

  send(element, ...args) {
    return this.Transport.prototype.send.call(this, element, ...args);
  }

  sendMany(...args) {
    return this.Transport.prototype.sendMany.call(this, ...args);
  }

  _findTransport(service) {
    return this.transports.find((Transport) => {
      try {
        return Transport.prototype.socketParameters(service) !== undefined;
      } catch {
        return false;
      }
    });
  }

  connect(service) {
    const Transport = this._findTransport(service);

    if (!Transport) {
      throw new Error("No compatible connection method found.");
    }

    this.Transport = Transport;
    this.Socket = Transport.prototype.Socket;
    this.Parser = Transport.prototype.Parser;

    return super.connect(service);
  }

  socketParameters(...args) {
    return this.Transport.prototype.socketParameters(...args);
  }

  header(...args) {
    return this.Transport.prototype.header(...args);
  }

  headerElement(...args) {
    return this.Transport.prototype.headerElement(...args);
  }

  footer(...args) {
    return this.Transport.prototype.footer(...args);
  }

  footerElement(...args) {
    return this.Transport.prototype.footerElement(...args);
  }
}

Client.prototype.NS = "jabber:client";

module.exports = Client;
