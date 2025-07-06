import JID from "@xmpp/jid";

import Context from "./Context.js";

export default class IncomingContext extends Context {
  constructor(entity, stanza) {
    super(entity, stanza);

    const { jid } = entity;
    const { domain } = entity.options ?? {};

    const to = stanza.attrs.to || jid?.toString();
    const from = stanza.attrs.from || domain;

    if (to) this.to = new JID(to);

    if (from) {
      this.from = new JID(from);
      this.local = this.from.local;
      this.domain = this.from.domain;
      this.resource = this.from.resource;
    }
  }
}
