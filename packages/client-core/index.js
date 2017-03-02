const Connection = require('@xmpp/connection')

class Client extends Connection {
  constructor (options) {
    super(options)
    this.transports = []
    this.uri = ''
  }

  send (element, ...args) {
    if (
      (this.socket.NS && this.socket.NS !== 'jabber:client') &&
      !element.attrs.xmlns &&
      (element.is('iq') || element.is('message') || element.is('presence'))
    ) {
      element.attrs.xmlns = 'jabber:client'
    }
    return super.send(element, ...args)
  }

  connect (uri) {
    this.connectOptions = uri
    let params
    const Transport = this.transports.find(Transport => {
      return params = Transport.match(uri) // eslint-disable-line no-return-assign
    })

    // FIXME callback?
    if (!Transport) throw new Error('No transport found')

    const sock = this.socket = new Transport()

    ;[
      'error', 'close', 'connect', 'open',
      'feature', 'element', 'stanza', 'send',
      'nonza', 'fragment', 'online',
      'authenticated', 'authenticate'
    ].forEach(e => {
      sock.on(e, (...args) => this.emit(e, ...args))
    })

    return sock.connect(params)
  }

  write (...args) {
    return this.socket.write(...args)
  }

  open (options) {
    this.openOptions = options
    return this.socket.open(options)
  }

  restart (...args) {
    return this.socket.restart(...args)
  }

  close (...args) {
    return this.socket.close(...args)
  }

  end (...args) {
    return this.socket.end(...args)
  }

  stop (...args) {
    return this.socket.stop(...args)
  }
}

Client.prototype.NS = 'jabber:client'

module.exports = Client
