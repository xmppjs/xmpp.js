'use strict'

const { promise } = require('@xmpp/events')
const jid = require('@xmpp/jid')
const plugin = require('@xmpp/plugin')

const NS_CLIENT = 'jabber:client'

function accept(socket) {
  return this.connect({ socket }).then(() => {
    promise(this.parser, 'start').then(el => {
      const headerElement = this.headerElement()
      if (
        el.name !== headerElement.name ||
        el.attrs.xmlns !== headerElement.attrs.xmlns ||
        !el.attrs.to ||
        el.attrs.to !== jid(el.attrs.to).domain
      ) {
        return this.promise('error')
      }

      this.domain = el.attrs.to
      this.lang = el.attrs['xml:lang']

      headerElement.attrs.from = this.domain
      headerElement.attrs['xml:lang'] = this.lang
      return this.write(this.header(headerElement)).then(() => {
        this._status('open', el)
      })
    })
  })
}

module.exports = plugin('accept', {
  start() {
    this.entity.NS = NS_CLIENT
    this.entity.accept = accept
  },

  stop() {
  },
})
