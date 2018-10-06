'use strict'

const XMPPError = require('@xmpp/error')

// https://xmpp.org/rfcs/rfc6120.html#streams-error

class StreamError extends XMPPError {
  constructor(...args) {
    super(...args)
    this.name = 'StreamError'
  }
}

module.exports = StreamError
