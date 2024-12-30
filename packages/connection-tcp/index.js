import Socket from "./Socket.js";
import Connection from "@xmpp/connection";
import { Parser } from "@xmpp/xml";
import { parseURI } from "@xmpp/connection/lib/util.js";

const NS_STREAM = "http://etherx.jabber.org/streams";

/* References
 * Extensible Messaging and Presence Protocol (XMPP): Core http://xmpp.org/rfcs/rfc6120.html
 */
class ConnectionTCP extends Connection {
  async sendMany(elements) {
    let fragment = "";

    for (const element of elements) {
      element.parent = this.root;
      fragment += element.toString();
    }

    await this.write(fragment);

    for (const element of elements) {
      this.emit("send", element);
    }
  }

  socketParameters(service) {
    const { port, hostname, protocol } = parseURI(service);

    return protocol === "xmpp:"
      ? { port: port ? Number(port) : null, host: hostname }
      : undefined;
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  headerElement() {
    const el = super.headerElement();
    el.name = "stream:stream";
    el.attrs["xmlns:stream"] = NS_STREAM;
    return el;
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  header(el) {
    return `<?xml version='1.0'?>${el.toString().slice(0, -2)}>`;
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-close
  footer() {
    return "</stream:stream>";
  }
}

ConnectionTCP.prototype.NS = NS_STREAM;
ConnectionTCP.prototype.Socket = Socket;
ConnectionTCP.prototype.Parser = Parser;

export default ConnectionTCP;
