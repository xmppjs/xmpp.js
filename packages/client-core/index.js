'use strict'

const Connection = require('@xmpp/connection')

class Client extends Connection {
  constructor (options) {
    super(options)
    this.transports = []
  }

  send (element, ...args) {
    if (
      !element.attrs.xmlns &&
      (element.is('iq') || element.is('message') || element.is('presence'))
    ) {
      element.attrs.xmlns = 'jabber:client' // FIXME no need for TCP/TLS transports
    }
    return super.send(element, ...args)
  }

  connect (uri) {
    this.connectOptions = uri
    let params
    const Transport = this.transports.find(Transport => {
      return params = Transport.match(uri) // eslint-disable-line no-return-assign
    })

    if (!Transport) throw new Error('No compatible connection method found.')

    this.Transport = Transport
    this.Socket = Transport.prototype.Socket

    return super.connect(params)
  }

  header (...args) {
    return this.Transport.prototype.header(...args)
  }

  footer (...args) {
    return this.Transport.prototype.footer(...args)
  }

  responseHeader (...args) {
    return this.Transport.prototype.footer(...args)
  }
}

Client.prototype.NS = 'jabber:client'

module.exports = Client
