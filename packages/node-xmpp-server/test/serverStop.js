'use strict'

/* global describe, it, beforeEach, afterEach */

var assert = require('assert')
var Server = require('../lib/C2S/TCP/Server')
var Client = require('node-xmpp-client')

var PORT = 6768

describe('server stop', function () {
  var server
  var client

  beforeEach(function (done) {
    server = new Server({port: PORT})
    server.on('connection', function (connection) {
      connection.on('authenticate', function (creds, cb) {
        cb(null, creds)
      })
    })
    server.listen(function () {
      client = new Client({
        jid: 'foo@localhost',
        password: 'foobar',
        port: PORT,
        host: 'localhost'
      })
      client.on('online', function () {
        done()
      })
    })
  })

  afterEach(function () {
    server = undefined
    client = undefined
  })

  it('it closes the port', function (done) {
    client.end()
    server.shutdown()
    var client2 = new Client({
      jid: 'bar@localhost',
      password: 'foobar',
      port: PORT,
      host: 'localhost'
    })
    client2.on('error', function (err) {
      assert.equal(err.code, 'ECONNREFUSED')
      done()
    })
  })

  it('disconnects all clients and shutdown the server', function (done) {
    var count = 0
    client.on('error', function () {})
    client.once('offline', function () {
      count++
      if (count === 2) done()
      client.end()
    })
    server.once('shutdown', function () {
      count++
      if (count === 2) done()
    })
    server.shutdown()
  })
})
