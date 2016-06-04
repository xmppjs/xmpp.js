import Connection from '@xmpp/connection-tcp'
import url from 'url'
import crypto from 'crypto'

/*
 * References
 * https://xmpp.org/extensions/xep-0114.html
 */

const NS = 'jabber:component:accept'

class Component extends Connection {
  connect (uri) {
    const {hostname, port} = url.parse(uri)
    return super.connect({port: port || 5347, hostname})
  }

  open (...args) {
    return super.open(...args)
      // save the stream id for authentication
      .then(({id}) => this.id = id)
  }

  // FIXME move to module?
  authenticate (password) {
    return new Promise((resolve, reject) => {
      // FIXME timeout
      this.once('nonza', (el) => {
        if (el.name !== 'handshake') reject(el)
        else {
          const jid = super._online(this._domain)
          resolve(jid)
        }
      })

      const hash = crypto.createHash('sha1')
      hash.update(this.id + password, 'binary')
      this.write(`<handshake>${hash.digest('hex')}</handshake>`)
    })
  }
}

Component.prototype.NS = NS

export {NS}
export default Component
