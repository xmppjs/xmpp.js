'use strict'

const Socket = require('net').Socket
const Connection = require('@xmpp/connection')

const NS_STREAM = 'http://etherx.jabber.org/streams'

/* References
 * Extensible Messaging and Presence Protocol (XMPP): Core http://xmpp.org/rfcs/rfc6120.html
*/

class TCP extends Connection {
  socketParameters (uri) {
    const params = super.socketParameters(uri)
    return (params.protocol === 'xmpp:')
      ? params
      : undefined
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  headerElement () {
    const el = super.headerElement()
    el.name = 'stream:stream'
    el.attrs['xmlns:stream'] = NS_STREAM
    return el
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  header (el) {
    const frag = el.toString()
    return `<?xml version='1.0'?>` + frag.substr(0, frag.length - 2) + '>'
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-close
  footer () {
    return '</stream:stream>'
  }
}

TCP.prototype.NS = NS_STREAM
TCP.prototype.Socket = Socket

module.exports = TCP
