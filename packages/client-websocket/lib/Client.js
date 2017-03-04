'use strict'

const Socket = require('./Socket')
const Connection = require('@xmpp/connection')
const xml = require('@xmpp/xml')

const NS_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing'

/* References
 * WebSocket protocol https://tools.ietf.org/html/rfc6455
 * WebSocket Web API https://html.spec.whatwg.org/multipage/comms.html#network
 * XMPP over WebSocket https://tools.ietf.org/html/rfc7395
*/

class Client extends Connection {
  // https://tools.ietf.org/html/rfc7395#section-3.4
  responseHeader (el, domain) {
    const {name, attrs} = el
    return (
      name === 'open' &&
      attrs.version === '1.0' &&
      attrs.xmlns === NS_FRAMING &&
      attrs.from === domain &&
      attrs.id
    )
  }

  // https://tools.ietf.org/html/rfc7395#section-3.4
  header (domain, lang) {
    return xml`<open ${lang ? `xml:lang='${lang}'` : ''} version='1.0' xmlns='${NS_FRAMING}' to='${domain}'/>`
  }

  // https://tools.ietf.org/html/rfc7395#section-3.6
  footer () {
    return xml`<close xmlns="${NS_FRAMING}"/>`
  }

  static match (uri) {
    return uri.match(/^wss?:\/\//) ? uri : null
  }
}

Client.prototype.Socket = Socket
Client.prototype.NS = 'jabber:client'

module.exports = Client
