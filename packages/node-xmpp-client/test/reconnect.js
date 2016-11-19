/* global describe, it, before, after */

'use strict'

var Client = require('../index')
var assert = require('assert')
var C2SServer = require('node-xmpp-server').C2SServer

var user = {
  jid: 'me@localhost',
  password: 'secret'
}

function startServer (done) {
  // Sets up the server.
  var c2s = new C2SServer({
    port: 5225,
    domain: 'localhost'
  })

  // Allows the developer to register the jid against anything they want
  c2s.on('register', function (opts, cb) {
    cb(true)
  })

  // On Connect event. When a client connects.
  c2s.on('connect', function (stream) {
    // That's the way you add mods to a given server.

    // Allows the developer to authenticate users against anything they want.
    stream.on('authenticate', function (opts, cb) {
      cb(null, opts)
    })

    // Stanza handling
    stream.on('stanza', function () {
      // got stanza
    })

    // On Disconnect event. When a client disconnects
    stream.on('disconnect', function () {
      // client disconnect
    })

    stream.on('error', function (e) {
      done(e)
    })
  })

  c2s.on('error', function (e) {
    done(e)
  })

  return c2s
}

function createChain (cl) {
  var eventChain = []
  ;['connect', 'reconnect', 'disconnect', 'online', 'offline'].forEach(function (event) {
    cl.on(event, function () {
      eventChain.push(event)
    })
  })
  return eventChain
}

describe.skip('Reconnect', function () {
  describe('Network problems', function () {
    var c2s = null

    before(function (done) {
      c2s = startServer(done)
      done()
    })

    after(function (done) {
      c2s.shutdown(done)
    })

    it('should reconnect when server connection is temporary lost', function (done) {
      var cl = new Client({
        jid: user.jid,
        password: user.password,
        reconnect: true,
        port: 5225
      })
      var eventChain = createChain(cl)

      cl.once('online', function () {
        cl.once('online', function () {
          assert.deepEqual(eventChain, [
            'connect', 'online', 'disconnect',
            'server:shutdown', 'server:listen', 'server:online',
            'reconnect', 'connect', 'online'
          ])
          cl.once('offline', done)
          cl.end()
        })
        // now lets loose the server connectino
        c2s.shutdown(function () {
          eventChain.push('server:shutdown')
          setTimeout(function () {
            eventChain.push('server:listen')
            c2s.listen(function () {
              eventChain.push('server:online')
            })
          }, 42)
        })
      })
      cl.on('error', function (e) {
        eventChain.push('error')
        done(e)
      })
    })

    it('should keep reconnecting', function (done) {
      var cl = new Client({
        jid: user.jid,
        password: user.password,
        reconnect: true,
        initialReconnectDelay: 10,
        maxReconnectDelay: 11,
        port: 5225
      })
      var eventChain = createChain(cl)

      cl.once('online', function () {
        cl.once('online', function () {
          // expecting 4 reconnects (42ms / 11ms)
          assert.deepEqual(eventChain, [
            'connect', 'online', 'disconnect',
            'server:shutdown',
            'reconnect', 'disconnect',
            'reconnect', 'disconnect',
            'reconnect', 'disconnect',
            'server:listen', 'server:online',
            'reconnect', 'connect', 'online'
          ])
          cl.once('offline', done)
          cl.end()
        })
        // now lets loose the server connectino
        c2s.shutdown(function () {
          eventChain.push('server:shutdown')
          setTimeout(function () {
            eventChain.push('server:listen')
            c2s.listen(function () {
              eventChain.push('server:online')
            })
          }, 42)
        })
      })
      cl.on('error', function (e) {
        eventChain.push('error')
        done(e)
      })
    })
  })
})
