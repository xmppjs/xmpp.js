/* global describe, it, before, after */

'use strict'

var nodexmppserver = require('node-xmpp-server')
var C2SServer = nodexmppserver.C2SServer
var Stanza = require('node-xmpp-core').Stanza
var net = require('net')
var util = require('util')
var Client = require('../index')
var Plain = nodexmppserver.auth.Plain
var XOAuth2 = nodexmppserver.auth.XOAuth2
var DigestMD5 = nodexmppserver.auth.DigestMD5

function ServerCustomMechanism () {}
util.inherits(ServerCustomMechanism, nodexmppserver.auth.AbstractMechanism)
ServerCustomMechanism.prototype.extractSasl = function (auth) {
  var authRequest = {
    password: auth
  }
  return authRequest
}
ServerCustomMechanism.prototype.name = 'CUSTOM'
ServerCustomMechanism.id = 'CUSTOM'

function ClientCustomMechanism () {}
util.inherits(ClientCustomMechanism, Client.SASL.AbstractMechanism)
ClientCustomMechanism.prototype.name = 'CUSTOM'
ClientCustomMechanism.prototype.auth = function () {
  return this.password
}
ClientCustomMechanism.prototype.match = function () {
  return true
}

var user = {
  jid: 'me@localhost',
  password: 'secret'
}

function startServer (mechanism, done) {
  // Sets up the server.
  var c2s = new C2SServer({
    port: 5225,
    domain: 'localhost',
    autostart: false
  })

  if (mechanism) {
    // remove plain
    c2s.availableSaslMechanisms = []
    c2s.registerSaslMechanism(mechanism)
  }

  c2s.listen()

  // Allows the developer to register the jid against anything they want
  c2s.on('register', function (opts, cb) {
    cb(true)
  })

  // On Connect event. When a client connects.
  c2s.on('connect', function (stream) {
    // That's the way you add mods to a given server.

    // Allows the developer to authenticate users against anything they want.
    stream.on('authenticate', function (opts, cb) {
      if ((opts.saslmech === Plain.id) &&
        (opts.jid.toString() === user.jid) &&
        (opts.password === user.password)) {
        // PLAIN OKAY
        cb(null, opts)
      } else if ((opts.saslmech === XOAuth2.id) &&
        (opts.jid.toString() === 'me@gmail.com') &&
        (opts.oauth_token === 'xxxx.xxxxxxxxxxx')) {
        // OAUTH2 OKAY
        cb(null, opts)
      } else if ((opts.saslmech === DigestMD5.id) &&
        (opts.jid.toString() === user.jid)) {
        // DIGEST-MD5 OKAY

        opts.password = 'secret'
        cb(null, opts)
      } else if ((opts.saslmech === ServerCustomMechanism.id) &&
        (opts.password === user.password)) {
        // CUSTOM OKAY
        cb(null, opts)
      } else {
        cb(new Error('Authentication failure'), null)
      }
    })

    stream.on('online', function () {
      stream.send(new Stanza('message', {
        type: 'chat'
      })
        .c('body')
        .t('Hello there, little client.')
      )
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

function createClient (opts) {
  opts.port = 5225
  var cl = new Client(opts)

  cl.on('stanza', function (stanza) {
    if (stanza.is('message') &&
      // Important: never reply to errors!
      (stanza.attrs.type !== 'error')) {
      // Swap addresses...
      stanza.attrs.to = stanza.attrs.from
      delete stanza.attrs.from
      // and send back.
      cl.send(stanza)
    } else {
      console.log('INCLIENT STANZA PRE', stanza.toString())
    }
  }
  )

  return cl
}

describe('SASL', function () {
  describe('PLAIN', function () {
    var c2s = null

    before(function (done) {
      c2s = startServer(Plain, done)
      done()
    })

    after(function (done) {
      c2s.shutdown(done)
    })

    it('should accept plain authentication', function (done) {
      var cl = createClient({
        jid: user.jid,
        password: user.password,
        preferred: Plain.id,
        port: 5225
      })

      cl.on('online', function () {
        cl.once('offline', done)
        cl.end()
      })
      cl.on('error', function (e) {
        done(e)
      })
    })

    it('should not accept plain authentication', function (done) {
      var cl = createClient({
        jid: user.jid,
        password: 'secretsecret'
      })

      cl.on('online', function () {
        done('user is not valid')
      })
      cl.on('error', function () {
        // this should happen
        done()
      })
    })
  })

  describe('XOAUTH-2', function () {
    var c2s = null

    before(function (done) {
      c2s = startServer(XOAuth2)
      done()
    })

    after(function (done) {
      c2s.shutdown(done)
    })

    /*
     * google talk is replaced by google hangout,
     * but we can support the protocol anyway
     */
    it('should accept google authentication', function (done) {
      var gtalk = createClient({
        jid: 'me@gmail.com',
        oauth2_token: 'xxxx.xxxxxxxxxxx', // from OAuth2
        oauth2_auth: 'http://www.google.com/talk/protocol/auth',
        host: 'localhost'
      })

      gtalk.on('online', function () {
        gtalk.once('offline', done)
        gtalk.end()
      })
      gtalk.on('error', function (e) {
        done(e)
      })
    })
  })

  describe('DIGEST MD5', function () {
    var c2s = null

    before(function (done) {
      c2s = startServer(DigestMD5)
      done()
    })

    after(function (done) {
      c2s.shutdown(done)
    })

    it('should accept digest md5 authentication', function (done) {
      var cl = createClient({
        jid: user.jid,
        password: user.password,
        preferred: 'DIGEST-MD5',
        port: 5225
      })

      cl.on('online', function () {
        cl.once('offline', done)
        cl.end()
      })
      cl.on('error', function (e) {
        done(e)
      })
    })

    it('should not allow to skip digest md5 challenges', function (done) {
      // preparing a sequence of stanzas to send
      var handshakeStanza = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<stream:stream to="localhost" xmlns="jabber:client" ' +
        'xmlns:stream="http://etherx.jabber.org/streams" ' +
        'xml:l="en" version="1.0">'

      var authStanza = '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" ' +
        'mechanism="DIGEST-MD5"/>'

      var earlyAccessStanza = '<response ' +
        'xmlns="urn:ietf:params:xml:ns:xmpp-sasl"/>'

      /*
       * we cannot use existing client realization
       * because we need to skip challenge response
       */
      var client = net.connect({port: c2s.options.port}, function () {
        client.write(handshakeStanza, function () {
          client.write(authStanza, function () {
            client.write(earlyAccessStanza, function () {
              // send earlyAccessStanza to receive 'success'
              client.write(earlyAccessStanza)
            })
          })
        })
      })

      var receivedData = ''

      client.on('data', function (data) {
        receivedData += data
      })

      client.setTimeout(500, function () {
        if (/<\/failure>$/.test(receivedData.toString())) {
          client.end()
          done()
        } else {
          client.end()
          done('wrong server response')
        }
      })
    })
  })

  describe('CUSTOM', function () {
    var c2s = null

    before(function (done) {
      c2s = startServer(ServerCustomMechanism, done)
      done()
    })

    after(function (done) {
      c2s.shutdown(done)
    })

    it('should accept custom authentication', function (done) {
      var cl = createClient({
        jid: user.jid,
        password: user.password,
        preferred: ClientCustomMechanism.id,
        autostart: false
      })

      cl.clearSaslMechanism()
      cl.registerSaslMechanism(ClientCustomMechanism)

      cl.connect()

      cl.on('online', function () {
        cl.once('offline', done)
        cl.end()
      })
      cl.on('error', function (e) {
        done(e)
      })
    })

    it('should not accept custom authentication', function (done) {
      var cl = createClient({
        jid: user.jid,
        password: 'secretsecret',
        preferred: ClientCustomMechanism.id,
        autostart: false
      })

      cl.clearSaslMechanism()
      cl.registerSaslMechanism(ClientCustomMechanism)

      cl.connect()

      cl.on('online', function () {
        done('user is not valid')
      })
      cl.on('error', function () {
        // this should happen
        done()
      })
    })
  })
})
