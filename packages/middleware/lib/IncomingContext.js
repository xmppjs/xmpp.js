"use strict";

const Context = require("./Context");
const JID = require("@xmpp/jid");

module.exports = class IncomingContext extends Context {
  constructor(entity, stanza) {
    super(entity, stanza);

    const { jid, domain } = entity;

    const to = stanza.attrs.to || (jid && jid.toString());
    const from = stanza.attrs.from || domain;

    if (to) this.to = new JID(to);

    if (from) {
      this.from = new JID(from);
      this.local = this.from.local;
      this.domain = this.from.domain;
      this.resource = this.from.resource;
    }
  }
};
