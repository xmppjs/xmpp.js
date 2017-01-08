'use strict'

const Connection = require('@xmpp/connection-tcp')
const url = require('url')
const crypto = require('crypto')
const {tagString, tag} = require('@xmpp/xml')

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

  waitHeader (domain, lang) {
    return new Promise((resolve, reject) => {
      this.parser.once('start', (el) => {
        const {name, attrs} = el
        if (
          name === 'stream:stream' &&
          attrs.xmlns === this.NS &&
          attrs['xmlns:stream'] === super.NS &&
          attrs.from === domain &&
          attrs.id
        ) {
          resolve(el)
          this.emit('authenticate', (secret) => {
            return this.authenticate(attrs.id, secret)
          })
        } else {
          reject()
        }
      })
    })
  }

  // FIXME move to module?
  authenticate (id, password) {
    const hash = crypto.createHash('sha1')
    hash.update(id + password, 'binary')
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
