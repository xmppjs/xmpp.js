import Context from "./Context.js";
import JID from "@xmpp/jid";

export default class OutgoingContext extends Context {
  constructor(entity, stanza) {
    super(entity, stanza);

    const { jid, domain } = entity;

    const from = stanza.attrs.from || (jid && jid.toString());
    const to = stanza.attrs.to || domain;

    if (from) this.from = new JID(from);

    if (to) {
      this.to = new JID(to);
      this.local = this.to.local;
      this.domain = this.to.domain;
      this.resource = this.to.resource;
    }
  }
}
