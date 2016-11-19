'use strict'

/* global describe, it, afterEach */

var XMPP = require('../../..')
var Server = XMPP.C2S.TCPServer
var Plain = XMPP.auth.Plain
var JID = XMPP.JID
var Client = require('node-xmpp-client')

var port = 5225
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
    stream.on('bind', function (resource, cb) {
      if (action === 'fail') {
        cb({
          type: 'cancel',
          condition: 'not-allowed',
          text: 'Test error'
        }, null)
      } else {
        cb(null, action === 'modified' ? resource + '-' + 'mod' : resource)
      }
    })
  })

  return server
}

function startClient (cb) {
  var client = new Client({
    host: 'localhost',
    jid: user.jid,
    port: port,
    password: user.password,
    preferred: Plain.id
  })

  client.on('online', function (data) {
    cb(null, data.jid.resource)
  })
  client.on('error', function (error) {
    cb(error, null)
  })

  return client
}

describe('Stream resource bind', function () {
  var server, client

  afterEach(function (done) {
    client.end()
    server.end(done)
  })

  it('Should bind unmodified', function (done) {
    server = startServer('unmodified')
    client = startClient(function (error, resource) {
      if (error) {
        done(error)
      } else if (resource !== user.jid.resource) {
        done(new Error('Wrong resource: ' + resource))
      } else {
        done()
      }
    })
  })

  it('Should bind modified', function (done) {
    server = startServer('modified')
    client = startClient(function (error, resource) {
      if (error) {
        done(error)
      } else if (resource !== user.jid.resource + '-' + 'mod') {
        done(new Error('Wrong resource: ' + resource))
      } else {
        done()
      }
    })
  })

  it('Should not bind', function (done) {
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
