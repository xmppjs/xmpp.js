'use strict'

/* https://xmpp.org/rfcs/rfc6120.html#stanzas-error */

const XMPPError = require('@xmpp/error')

class StanzaError extends XMPPError {
  constructor(condition, text, application, type) {
    super(condition, text, application)
    this.type = type
    this.name = 'StanzaError'
  }

  static fromElement(element) {
    const error = super.fromElement(element)
    error.type = element.attrs.type
    return error
  }
}

module.exports = StanzaError
