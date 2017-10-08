'use strict'

/* global describe, it, afterEach */

const XMPP = require('../../..')
const Server = XMPP.C2S.TCPServer
const Plain = XMPP.auth.Plain
const JID = XMPP.JID
const Client = require('node-xmpp-client')

const port = 5225
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
    stream.on('bind', (resource, cb) => {
      if (action === 'fail') {
        cb({ // eslint-disable-line
          type: 'cancel',
          condition: 'not-allowed',
          text: 'Test error',
        }, null)
      } else {
        cb(null, action === 'modified' ? `${resource}-mod` : resource)
      }
    })
  })

  return server
}

function startClient (cb) {
  const client = new Client({
    host: 'localhost',
    jid: user.jid,
    port,
    password: user.password,
    preferred: Plain.id,
  })

  client.on('online', (data) => {
    cb(null, data.jid.resource)
  })
  client.on('error', (error) => {
    cb(error, null)
  })

  return client
}

describe('Stream resource bind', () => {
  let server, client

  afterEach((done) => {
    client.end()
    server.end(done)
  })

  it('Should bind unmodified', (done) => {
    server = startServer('unmodified')
    client = startClient((error, resource) => {
      if (error) {
        done(error)
      } else if (resource !== user.jid.resource) {
        done(new Error(`Wrong resource: ${resource}`))
      } else {
        done()
      }
    })
  })

  it('Should bind modified', (done) => {
    server = startServer('modified')
    client = startClient((error, resource) => {
      if (error) {
        done(error)
      } else if (resource !== `${user.jid.resource}-mod`) {
        done(new Error(`Wrong resource: ${resource}`))
      } else {
        done()
      }
    })
  })

  it('Should not bind', (done) => {
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
