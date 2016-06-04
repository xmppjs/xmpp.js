const Socket = require('./Socket')
const Connection = require('@xmpp/connection')
const xml = require('@xmpp/xml')

const NS_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing'

/* References
 * WebSocket protocol https://tools.ietf.org/html/rfc6455
 * WebSocket Web API https://html.spec.whatwg.org/multipage/comms.html#network
 * XMPP over WebSocket https://tools.ietf.org/html/rfc7395
*/

class WebSocket extends Connection {
  // https://tools.ietf.org/html/rfc7395#section-3.4
  waitHeader (domain, lang) {
    return new Promise((resolve, reject) => {
      this.parser.once('start', (el) => {
        const {name, attrs} = el
        if (
          name === 'open' &&
          attrs.version === '1.0' &&
          attrs.xmlns === this.NS &&
          attrs.from === domain &&
          attrs.id
        ) {
          resolve(el)
        } else {
          reject()
        }
      })
    })
  }

  // https://tools.ietf.org/html/rfc7395#section-3.4
  header (domain, lang) {
    return xml`<open xml:lang='${lang}' version='1.0' xmlns='${NS_FRAMING}' to='${domain}'/>`
  }

  // https://tools.ietf.org/html/rfc7395#section-3.6
  footer () {
    return xml`<close xmlns=${NS_FRAMING}/>`
  }

  static match (uri) {
    return uri.match(/^wss?:\/\//) ? uri : null
  }
}

WebSocket.prototype.Socket = Socket
WebSocket.prototype.NS = NS_FRAMING

module.exports = WebSocket
module.exports.NS_FRAMING = NS_FRAMING
