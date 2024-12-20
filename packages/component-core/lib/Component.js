import Connection from "@xmpp/connection-tcp";
import { createHash } from "crypto";
import xml from "@xmpp/xml";

/*
 * References
 * https://xmpp.org/extensions/xep-0114.html done
 * https://xmpp.org/extensions/xep-0225.html) todo
 */

const NS = "jabber:component:accept";

class Component extends Connection {
  socketParameters(service) {
    const params = super.socketParameters(service);
    params.port = params.port || 5347;
    return params;
  }

  // https://xmpp.org/extensions/xep-0114.html#example-4
  send(el) {
    // All stanzas sent to the server MUST possess a 'from' attribute and a 'to' attribute, as in the 'jabber:server' namespace
    if (this.isStanza(el) && !el.attrs.from) {
      el.attrs.from = this.jid.toString();
    }

    return super.send(el);
  }

  // https://xmpp.org/extensions/xep-0114.html#example-3
  async authenticate(id, password) {
    const hash = createHash("sha1");
    hash.update(id + password, "binary");
    const el = await this.sendReceive(xml("handshake", {}, hash.digest("hex")));
    if (el.name !== "handshake") {
      throw new Error("Unexpected server response");
    }

    this._jid(this.options.domain);
    this._status("online", this.jid);
  }
}

Component.NS = NS;
Component.prototype.NS = NS;

export default Component;
