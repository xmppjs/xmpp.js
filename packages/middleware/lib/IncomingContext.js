'use strict'

const Context = require('./Context')
const JID = require('@xmpp/jid')

module.exports = class IncomingContext extends Context {
  constructor(entity, stanza) {
    super(entity, stanza)

    const { to: stanzaTo, from: stanzaFrom } = stanza.attrs

    this.to = stanzaTo ? new JID(stanzaTo) : entity.jid

    const from = stanzaFrom || (entity.jid && entity.jid.domain) || entity.openOptions.domain
    if (from) {
      this.from = new JID(from)
      this.local = this.from.local || ''
      this.domain = this.from.domain
      this.resource = this.from.resource || ''
    }
  }
}
