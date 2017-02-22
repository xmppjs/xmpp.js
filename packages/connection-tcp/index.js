'use strict'

const Socket = require('net').Socket
const Connection = require('@xmpp/connection')
const StreamParser = require('./lib/StreamParser')
const {tagString} = require('@xmpp/xml')

const NS_STREAM = 'http://etherx.jabber.org/streams'

/* References
 * Extensible Messaging and Presence Protocol (XMPP): Core http://xmpp.org/rfcs/rfc6120.html
*/

class TCP extends Connection {
  // FIXME is lang useful?
  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  waitHeader (domain, lang) {
    return new Promise((resolve, reject) => {
      this.parser.once('start', (el) => {
        const {name, attrs} = el

        if (
          name === 'stream:stream' &&
          attrs.xmlns === this.NS &&
          attrs['xmlns:stream'] === NS_STREAM &&
          attrs.from === domain &&
          attrs.version === '1.0' &&
          attrs.id
        ) {
          resolve(el)
        } else {
          reject()
        }
      })
    })
  }

  // https://xmpp.org/rfcs/rfc6120.html#streams-open
  header (domain, lang) {
    return tagString`
      <?xml version='1.0'?>
      <stream:stream to='${domain}' version='1.0' xml:lang='${lang}' xmlns='${this.NS}' xmlns:stream='${NS_STREAM}'>
    `
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
TCP.prototype.Parser = StreamParser

module.exports = TCP
