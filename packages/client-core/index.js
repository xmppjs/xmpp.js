import Connection from '@xmpp/connection'

class Client extends Connection {
  constructor (options) {
    super(options)
    this.transports = []
    this.uri = ''
  }

  connect (uri) {
    let params
    const Transport = this.transports.find(Transport => {
      return params = Transport.match(uri) // eslint-disable-line no-return-assign
    })

    // FIXME callback?
    if (!Transport) throw new Error('No transport found')

    const sock = this.socket = new Transport()

    ;[
      'error', 'close', 'connect',
      'features', 'element', 'stanza',
      'nonza', 'fragment'
    ].forEach(e => {
      sock.on(e, (...args) => this.emit(e, ...args))
    })

    return sock.connect(uri)
      .then(() => {
        this.uri = uri
        return params
      })
  }

  open (...args) {
    return this.socket.open(...args)
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

export default Client
