'use strict'

/* global describe, it, beforeEach, afterEach */

const assert = require('assert')
const Server = require('../lib/C2S/TCP/Server')
const Client = require('@xmpp/client')

const PORT = 6768

describe('server stop', () => {
  let server
  let client

  beforeEach((done) => {
    server = new Server({ port: PORT })
    server.on('connection', (connection) => {
      connection.on('authenticate', (creds, cb) => {
        cb(null, creds)
      })
    })
    server.listen(() => {
      client = new Client({
        jid: 'foo@localhost',
        password: 'foobar',
        port: PORT,
        host: 'localhost',
      })
      client.on('online', () => {
        done()
      })
    })
  })

  afterEach(() => {
    server = undefined
    client = undefined
  })

  it('it closes the port', (done) => {
    client.end()
    server.shutdown()
    const client2 = new Client({
      jid: 'bar@localhost',
      password: 'foobar',
      port: PORT,
      host: 'localhost',
    })
    client2.on('error', (err) => {
      assert.equal(err.code, 'ECONNREFUSED')
      done()
    })
  })

  it('disconnects all clients and shutdown the server', (done) => {
    let count = 0
    client.on('error', () => { })
    client.once('offline', () => {
      count++
      if (count === 2) done()
      client.end()
    })
    server.once('shutdown', () => {
      count++
      if (count === 2) done()
    })
    server.shutdown()
  })
})
