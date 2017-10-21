'use strict'

const Context = require('./Context')
const JID = require('@xmpp/jid')

module.exports = class OutgoingContext extends Context {
  constructor(entity, stanza) {
    super(entity, stanza)

    const { to: stanzaTo, from: stanzaFrom } = stanza.attrs

    this.from = stanzaFrom ? new JID(stanzaFrom) : entity.jid

    const to = stanzaTo || (entity.jid && entity.jid.domain) || entity.openOptions.domain
    if (to) {
      this.to = new JID(to)
      this.local = this.to.local || ''
      this.domain = this.to.domain
      this.resource = this.to.resource || ''
    }
  }
}
