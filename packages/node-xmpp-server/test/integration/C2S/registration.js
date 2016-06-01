'use strict'

/* global describe, it, afterEach */

var XMPP = require('../../..')
var Server = XMPP.C2S.TCPServer
var Plain = XMPP.auth.Plain
var JID = XMPP.JID
var Client = require('node-xmpp-client')

var port = 5223
var user = {
  jid: new JID('me@localhost/res'),
  password: 'secret'
}

function startServer (action) {
  var server = new Server({
    port: port,
    domain: 'localhost'
  })

  server.on('connect', function (stream) {
    stream.on('authenticate', function (opts, cb) {
      cb(null, opts)
    })
    stream.on('register', function (data, cb) {
      if (action === 'fail') {
        cb({
          code: 503,
          type: 'cancel',
          condition: 'service-unavailable',
          text: 'Test error'
        }, null)
      } else {
        cb(null)
      }
    })
  })

  return server
}

function startClient (cb) {
  var client = new Client({
    host: 'localhost',
    port: port,
    jid: user.jid,
    password: user.password,
    preferred: Plain.id,
    register: true
  })

  client.on('online', function () {
    cb(null)
  })
  client.on('error', function (error) {
    cb(error)
  })

  return client
}

describe('Stream register', function () {
  var server, client

  afterEach(function (done) {
    client.end()
    server.end(done)
  })

  it('Should register', function (done) {
    server = startServer('unmodified')
    client = startClient(function (error) {
      if (error) {
        done(error)
      } else {
        done()
      }
    })
  })

  it('Should not register', function (done) {
    server = startServer('fail')
    client = startClient(function (error) {
      if (!error) {
        done(new Error('No error'))
      } else {
        done()
      }
    })
  })
})
