'use strict'

const Context = require('./Context')
const JID = require('@xmpp/jid')

module.exports = class OutgoingContext extends Context {
  constructor(entity, stanza) {
    super(entity, stanza)

    const {to, from} = stanza.attrs

    this.from = from ? new JID(from) : entity.jid
    this.to = new JID(
      to || (entity.jid && entity.jid.domain) || entity.openOptions.domain
    )

    this.local = this.to.local || ''
    this.domain = this.to.domain
    this.resource = this.to.resource || ''
  }
}
