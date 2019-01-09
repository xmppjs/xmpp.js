'use strict'

const xml = require('@xmpp/xml')
const WebSocket = require('ws')
const Connection = require('@xmpp/websocket/lib/Connection')

const wss = new WebSocket.Server({port: 5280})

wss.on('connection', function connection(ws) {
  let authenticated = false

  const conn = new Connection()
  conn.socket = ws
  conn.socket.write = (data, cb) => {
    conn.socket.send(data, cb)
  }
  conn._attachParser(new conn.Parser())

  conn.parser.on('start', async el => {
    const headerElement = conn.headerElement()
    headerElement.attrs.from = el.attrs.to
    headerElement.attrs['xml:lang'] = el.attrs.lang
    headerElement.attrs.version = '1.0'
    headerElement.attrs.id = Math.random()
      .toString()
      .split('0.')[1]

    await conn.write(conn.header(headerElement))

    if (!authenticated) {
      console.log('foobar')

      const streamFeatures = xml(
        'features',
        {xmlns: 'http://etherx.jabber.org/streams'},
        xml(
          'mechanisms',
          {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'},
          xml('mechanisms', {}, 'PLAIN')
        )
      )

      await conn.write(streamFeatures.toString())
      return
    }

    if (authenticated) {
      const streamFeatures = xml(
        'features',
        {xmlns: 'http://etherx.jabber.org/streams'},
        xml('bind', {xmlns: 'urn:ietf:params:xml:ns:xmpp-bind'})
      )

      await conn.write(streamFeatures.toString())
      return
    }
  })

  conn.parser.on('element', async element => {
    if (element.name === 'auth') {
      var auth = Buffer.from(element.text(), 'base64').toString('utf8')
      var [, username, password] = auth.split('\x00')
      conn.write(xml('success', {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'}))
      authenticated = true
    }
  })

  conn.parser.on('end', el => {
    console.log('start', el.toString())
  })

  conn.parser.on('error', el => {
    console.log('error', el.toString())
  })

  ws.on('message', function incoming(message) {
    conn.parser.write(message.toString())
    // console.log('received: %s', message)
  })

  // ws.send('something')
})
