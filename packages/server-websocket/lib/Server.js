'use strict'

const WebSocketServer = require('ws').Server
const {EventEmitter, promise} = require('@xmpp/events')
const parse = require('@xmpp/xml/lib/parse')
const xml = require('@xmpp/xml')
const xid = require('@xmpp/id')
const JID = require('@xmpp/jid')

const xmlns = 'urn:ietf:params:xml:ns:xmpp-framing'

class Connection extends EventEmitter {
  constructor(socket) {
    super()
    this.socket = socket
    this.open = false
  }

  send(element) {
    this.socket.send(element.toString())
  }
}

class Server extends EventEmitter {
  constructor() {
    super()
    this.server = null
    this.port = null
    this.domain = ''
  }

  start(options) {
    if (typeof options === 'string') {
      options = {domain: options}
    } else if (!options) {
      options = {}
    }

    const domain = options.domain || 'localhost'
    this.domain = domain
    this.jid = JID(domain)

    const port = options.port || 5280
    this.port = port

    const server = (this.server = new WebSocketServer({port}))

    server.on('connection', conn => this._onConnection(conn))

    return promise(server, 'listening')
  }

  _onConnection(conn) {
    const connection = new Connection(conn, this.domain)
    this.emit('connection', connection)

    conn.on('message', message => {
      this._onMessage(message, connection)
    })
  }

  _onMessage(message, conn) {
    let element
    try {
      element = parse(message)
    } catch (err) {
      console.error(err)
      return
    }

    this.emit('element', element)

    if (
      element.is('open') &&
      element.attrs.version === '1.0' &&
      element.attrs.xmlns === xmlns &&
      element.attrs.to === this.domain
    ) {
      this._onOpen(element, conn)
    } else if (
      element.is('auth') &&
      element.attrs.xmlns === 'urn:ietf:params:xml:ns:xmpp-sasl' &&
      element.attrs.mechanism === 'ANONYMOUS'
    ) {
      this._onAuth(element, conn)
    } else if (
      element.is('iq') &&
      element.attrs.type === 'set' &&
      element.getChild('bind', 'urn:ietf:params:xml:ns:xmpp-bind')
    ) {
      this._onBind(element, conn)
    }
  }

  _onBind(element, conn) {
    const {id} = element.attrs
    const resource = element.getChild('bind').getChildText('resource')

    const jid = JID(xid(), this.domain, resource || xid())

    conn.jid = jid

    conn.send(
      xml(
        'iq',
        {type: 'result', id},
        xml(
          'bind',
          {xmlns: 'urn:ietf:params:xml:ns:xmpp-bind'},
          xml('jid', {}, jid)
        )
      )
    )
  }

  _onOpen(element, conn) {
    if (conn.open) {
      this._onRestart(element, conn)
      return
    }

    conn.open = true

    conn.send(
      xml('open', {
        from: this.domain,
        id: xid(),
        version: '1.0',
        xmlns,
      })
    )
    this._sendStreamFeatures(conn)
  }

  _onRestart(element, conn) {
    const el = xml(
      'stream:features',
      {'xmlns:stream': 'http://etherx.jabber.org/streams'},
      xml('bind', {xmlns: 'urn:ietf:params:xml:ns:xmpp-bind'}, xml('required'))
    )

    conn.send(el)
  }

  _onAuth(element, conn) {
    conn.send(xml('success', {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'}))
  }

  _sendStreamFeatures(conn) {
    const mechanisms = ['ANONYMOUS']

    const el = xml(
      'stream:features',
      {'xmlns:stream': 'http://etherx.jabber.org/streams'},
      xml(
        'mechanisms',
        {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'},
        mechanisms.map(m => xml('mechanism', {}, m))
      )
    )

    conn.send(el)
  }
}

module.exports = Server
