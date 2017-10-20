'use strict'

const Context = require('./Context')
const JID = require('@xmpp/jid')

module.exports = class IncomingContext extends Context {
  constructor(entity, stanza) {
    super(entity, stanza)

    const {to, from} = stanza.attrs

    this.from = new JID(
      from || (entity.jid && entity.jid.domain) || entity.openOptions.domain
    )

    this.to = to ? new JID(to) : entity.jid

    this.local = this.from.local || ''
    this.domain = this.from.domain
    this.resource = this.from.resource || ''
  }
}
