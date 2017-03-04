'use strict'

const Socket = require('net').Socket
const Connection = require('@xmpp/connection')
const {escapeXML} = require('@xmpp/xml')

const NS_STREAM = 'http://etherx.jabber.org/streams'

/* References
 * Extensible Messaging and Presence Protocol (XMPP): Core http://xmpp.org/rfcs/rfc6120.html
*/

class TCP extends Connection {
  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  responseHeader (el, domain) {
    const {name, attrs} = el
    return (
      name === 'stream:stream' &&
      attrs.xmlns === this.NS &&
      attrs['xmlns:stream'] === NS_STREAM &&
      attrs.from === domain &&
      attrs.version === '1.0' &&
      attrs.id
    )
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  header (domain, lang) {
    const attrs = {
      to: domain,
      version: '1.0',
      'xml:lang': lang,
      xmlns: this.NS,
      'xmlns:stream': NS_STREAM
    }
    let header = `<?xml version='1.0'?><stream:stream `
    for (let attr in attrs) {
      if (attrs[attr]) header += `${attr}='${escapeXML(attrs[attr])}' `
    }
    header += '>'
    return header
  }

  // // https://xmpp.org/rfcs/rfc6120.html#streams-close
  // waitFooter (fn) {
  //   this.parser.once('endElement', (name) => {
  //     if (name !== 'stream:stream') return // FIXME error
  //     fn()
  //   })
  // }

  // https://xmpp.org/rfcs/rfc6120.html#streams-close
  footer () {
    return '<stream:stream/>'
  }
}

TCP.NS = NS_STREAM
TCP.prototype.NS = NS_STREAM
TCP.prototype.Socket = Socket

module.exports = TCP
