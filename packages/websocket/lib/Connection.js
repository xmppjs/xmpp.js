import Socket from "./Socket.js";
import Connection from "@xmpp/connection";
import xml from "@xmpp/xml";
import FramedParser from "./FramedParser.js";

const NS_FRAMING = "urn:ietf:params:xml:ns:xmpp-framing";

/* References
 * WebSocket protocol https://tools.ietf.org/html/rfc6455
 * WebSocket Web API https://html.spec.whatwg.org/multipage/comms.html#network
 * XMPP over WebSocket https://tools.ietf.org/html/rfc7395
 */

class ConnectionWebSocket extends Connection {
  send(element, ...args) {
    if (!element.attrs.xmlns && super.isStanza(element)) {
      element.attrs.xmlns = "jabber:client";
    }

    return super.send(element, ...args);
  }

  async sendMany(elements) {
    for (const element of elements) {
      await this.send(element);
    }
  }

  // https://tools.ietf.org/html/rfc7395#section-3.6
  footerElement() {
    return new xml.Element("close", {
      xmlns: NS_FRAMING,
    });
  }

  // https://tools.ietf.org/html/rfc7395#section-3.4
  headerElement() {
    const el = super.headerElement();
    el.name = "open";
    el.attrs.xmlns = NS_FRAMING;
    return el;
  }

  socketParameters(service) {
    return /^wss?:\/\//.test(service) ? service : undefined;
  }
}

ConnectionWebSocket.prototype.Socket = Socket;
ConnectionWebSocket.prototype.NS = "jabber:client";
ConnectionWebSocket.prototype.Parser = FramedParser;

export default ConnectionWebSocket;
