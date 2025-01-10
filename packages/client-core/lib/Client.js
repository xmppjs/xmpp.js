import Connection from "@xmpp/connection";

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

  header(headerElement, ...args) {
    // if the client knows the XMPP identity then it SHOULD include the 'from' attribute
    // after the confidentiality and integrity of the stream are protected via TLS
    // or an equivalent security layer.
    // https://xmpp.org/rfcs/rfc6120.html#rfc.section.4.7.1
    const from = this.isSecure() && this.jid?.bare().toString();
    if (from) headerElement.attrs.from = from;
    return this.Transport.prototype.header(headerElement, ...args);
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

export default Client;
