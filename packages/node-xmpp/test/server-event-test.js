'use strict'

/* global describe, it, after, before */

var assert = require('assert')
var xmpp = require('../index')

var eventChain = []
var c2s = null

function startServer () {
  // Sets up the server.
  c2s = new xmpp.server.C2S.TCPServer({
    port: 5225,
    domain: 'localhost'
  })

  c2s.on('error', function (err) {
    console.log('c2s error: ' + err.message)
  })

  c2s.on('connect', function (client) {
    c2s.on('register', function (opts, cb) {
      cb(new Error('register not supported'))
    })

    // allow anything
    client.on('authenticate', function (opts, cb) {
      eventChain.push('authenticate')
      cb(null, opts)
    })

    client.on('online', function () {
      eventChain.push('online')
    })

    client.on('stanza', function () {
      eventChain.push('stanza')
      client.send(
        new xmpp.Message({ type: 'chat' })
          .c('body')
          .t('Hello there, little client.')
      )
    })

    client.on('disconnect', function () {
      eventChain.push('disconnect')
    })

    client.on('end', function () {
      eventChain.push('end')
    })

    client.on('close', function () {
      eventChain.push('close')
    })

    client.on('error', function () {
      eventChain.push('error')
    })
  })
}

describe.skip('C2Server', function () {
  var cl = null

  before(function (done) {
    startServer()
    done()
  })

  after(function (done) {
    c2s.shutdown()
    done()
  })

  describe('events', function () {
    it('should be in the right order for connecting', function (done) {
      eventChain = []

      // clientCallback = done
      cl = new xmpp.Client({
        jid: 'bob@example.com',
        password: 'alice',
        host: 'localhost',
        port: 5225
      })
      cl.on('online', function () {
        eventChain.push('clientonline')
        assert.deepEqual(eventChain, ['authenticate', 'online', 'clientonline'])
        done()
      })
      cl.on('error', function (e) {
        done(e)
      })
    })
    it('should ping pong stanza', function (done) {
      eventChain = []

      cl.on('stanza', function () {
        eventChain.push('clientstanza')
        assert.deepEqual(eventChain, ['stanza', 'clientstanza'])
        done()
      })

      cl.send(
        new xmpp.Message({ type: 'chat' })
          .c('body')
          .t('Hello there, little server.')
      )

      cl.on('error', function (e) {
        done(e)
      })
    })

    it('should close the connection', function (done) {
      eventChain = []

      // end xmpp stream
      cl.on('end', function () {
        eventChain.push('clientend')
      })

      // close socket
      cl.on('close', function () {
        eventChain.push('clientclose')
        assert.deepEqual(eventChain, ['end', 'disconnect', 'close', 'clientend', 'clientclose'])
        done()
      })

      cl.end()
    })
  })
})
