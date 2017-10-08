'use strict'

/* global describe, it, afterEach */

const XMPP = require('../../..')
const Server = XMPP.C2S.TCPServer
const Plain = XMPP.auth.Plain
const JID = XMPP.JID
const Client = require('node-xmpp-client')

const port = 5223
const user = {
  jid: new JID('me@localhost/res'),
  password: 'secret',
}

function startServer (action) {
  const server = new Server({
    port,
    domain: 'localhost',
  })

  server.on('connect', (stream) => {
    stream.on('authenticate', (opts, cb) => {
      cb(null, opts)
    })
    stream.on('register', (data, cb) => {
      if (action === 'fail') {
        cb({ // eslint-disable-line
          code: 503,
          type: 'cancel',
          condition: 'service-unavailable',
          text: 'Test error',
        }, null)
      } else {
        cb(null)
      }
    })
  })

  return server
}

function startClient (cb) {
  const client = new Client({
    host: 'localhost',
    port,
    jid: user.jid,
    password: user.password,
    preferred: Plain.id,
    register: true,
  })

  client.on('online', () => {
    cb(null)
  })
  client.on('error', (error) => {
    cb(error)
  })

  return client
}

describe('Stream register', () => {
  let server
  let client

  afterEach((done) => {
    client.end()
    server.end(done)
  })

  it('Should register', (done) => {
    server = startServer('unmodified')
    client = startClient((error) => {
      if (error) {
        done(error)
      } else {
        done()
      }
    })
  })

  it('Should not register', (done) => {
    server = startServer('fail')
    client = startClient((error) => {
      if (!error) {
        done(new Error('No error'))
      } else {
        done()
      }
    })
  })
})
