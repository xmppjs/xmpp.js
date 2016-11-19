const Connection = require('@xmpp/connection-tcp')
const url = require('url')
const crypto = require('crypto')
const {tagString, Element, tag} = require('@xmpp/xml')

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

  header (domain, lang) {
    return tagString`
      <?xml version='1.0'?>
      <stream:stream to='${domain}' xml:lang='${lang}' xmlns='${this.NS}' xmlns:stream='${super.NS}'>
    `
  }

  waitHeader (domain, lang, fn) {
    const handler = (name, attrs) => {
      if (name !== 'stream:stream') return // FIXME error
      // disabled because component doesn't use this
      // if (attrs.version !== '1.0') return // FIXME error
      if (attrs.xmlns !== this.NS) return // FIXME error
      if (attrs['xmlns:stream'] !== super.NS) return // FIXME error
      if (attrs.from !== domain) return // FIXME error
      if (!attrs.id) return // FIXME error
      this.id = attrs.id
      fn(null, new Element(name, attrs))
      this.emit('authenticate', (secret) => {
        return this.authenticate(secret)
      })
    }
    this.parser.once('startElement', handler)
  }

  // FIXME move to module?
  authenticate (password) {
    const hash = crypto.createHash('sha1')
    hash.update(this.id + password, 'binary')
    return this.sendReceive(tag`<handshake>${hash.digest('hex')}</handshake>`)
      .then((el) => {
        if (el.name !== 'handshake') {
          throw new Error('unexpected stanza')
        }
        this._authenticated()
        this._jid(this._domain)
        this._ready()
        this._online() // FIXME should be emitted after promise resolve
      })
  }
}

Component.NS = NS
Component.prototype.NS = NS

module.exports = Component
