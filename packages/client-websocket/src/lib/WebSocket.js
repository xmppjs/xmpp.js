import Socket from './Socket'
import Connection from '@xmpp/connection'

const NS_FRAMING = 'urn:ietf:params:xml:ns:xmpp-framing'

/* References
 * WebSocket protocol https://tools.ietf.org/html/rfc6455
 * WebSocket Web API https://html.spec.whatwg.org/multipage/comms.html#network
 * XMPP over WebSocket https://tools.ietf.org/html/rfc7395
*/

class WebSocket extends Connection {
  // https://tools.ietf.org/html/rfc7395#section-3.4
  waitHeader (domain, lang, fn) {
    const handler = (el) => {
      const {name, attrs} = el
      // FIXME error
      if (name !== 'open') return
      if (attrs.version !== '1.0') return
      if (attrs.xmlns !== NS_FRAMING) return
      if (attrs.from !== domain) return
      if (!attrs.id) return
      // if (!match(el, <open version='1.0' xmlns={NS_FRAMING} from={domain}/>)) return
      fn(null, el)
    }
    this.parser.once('element', handler)
  }

  // https://tools.ietf.org/html/rfc7395#section-3.4
  header (domain, lang) {
    const header = <open version='1.0' xmlns={NS_FRAMING} to={domain}/>
    header.attrs['xml:lang'] = lang
    return header
  }

  // https://tools.ietf.org/html/rfc7395#section-3.6
  footer () {
    return <close xmlns={NS_FRAMING}/>
  }

  static match (uri) {
    return uri.match(/^wss?:\/\//) ? uri : null
  }
}

WebSocket.prototype.Socket = Socket
WebSocket.prototype.NS = 'jabber:client'

export default WebSocket
export {NS_FRAMING}
