'use strict'

/* global describe, it, before, after, afterEach */

const XMPP = require('../../..')
const Server = XMPP.C2S.TCPServer
const Element = require('node-xmpp-core').Element
const net = require('net')
const rack = require('hat').rack
const Client = require('node-xmpp-client')
const Plain = XMPP.auth.Plain
const XOAuth2 = XMPP.auth.XOAuth2
const DigestMD5 = XMPP.auth.DigestMD5
const Anonymous = XMPP.auth.Anonymous

require('should')

const user = {
  jid: 'me@localhost',
  password: 'secret',
}

function startServer (mechanism) {
  // Sets up the server.
  const c2s = new Server({
    port: 5225,
    domain: 'localhost',
  })

  if (mechanism) {
    // Remove plain
    c2s.availableSaslMechanisms = []
    c2s.registerSaslMechanism(mechanism)
  }

  // Allows the developer to register the jid against anything they want
  c2s.on('register', (opts, cb) => {
    cb(true) // eslint-disable-line
  })

  // On Connect event. When a client connects.
  c2s.on('connect', (stream) => {
    // That's the way you add mods to a given server.

    // Allows the developer to authenticate users against anything they want.
    stream.on('authenticate', (opts, cb) => {
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
      } else if (opts.saslmech === Anonymous.id) {
        cb(null, opts)
      } else {
        cb(new Error('Authentication failure'), null)
      }
    })

    stream.on('online', () => {
      stream.send(new Element('message', {
        type: 'chat',
      })
        .c('body')
        .t('Hello there, little client.')
      )
    })

    // Stanza handling
    stream.on('stanza', () => {
      // Got stanza
    })

    // On Disconnect event. When a client disconnects
    stream.on('disconnect', () => {
      // Client disconnect
    })
  })

  return c2s
}

function createClient (opts) {
  opts.port = 5225
  const cl = new Client(opts)

  cl.on('stanza', (stanza) => {
    if (stanza.is('message') &&
      // Important: never reply to errors!
      (stanza.attrs.type !== 'error')) {
      // Swap addresses...
      stanza.attrs.to = stanza.attrs.from
      delete stanza.attrs.from
      // And send back.
      cl.send(stanza)
    } else {
      console.log('INCLIENT STANZA PRE', stanza.toString())
    }
  }
  )

  return cl
}

describe('SASL', () => {
  describe('PLAIN', () => {
    let c2s = null
    let cl = null

    afterEach((done) => {
      cl.once('offline', done)
      cl.end()
    })

    before((done) => {
      c2s = startServer(Plain)
      done()
    })

    after((done) => {
      c2s.end(done)
    })

    it('should accept plain authentication', (done) => {
      cl = createClient({
        jid: user.jid,
        password: user.password,
        preferred: Plain.id,
      })

      cl.on('online', () => {
        done()
      })
      cl.on('error', (e) => {
        console.log(e)
        done(e)
      })
    })

    it('should not accept plain authentication', (done) => {
      cl = createClient({
        jid: user.jid,
        password: 'secretsecret',
      })

      cl.on('online', () => {
        done('user is not valid')
      })
      cl.on('error', () => {
        // This should happen
        done()
      })
    })
  })

  describe('XOAUTH-2', () => {
    let c2s = null
    let cl = null

    afterEach((done) => {
      cl.once('offline', done)
      cl.end()
    })

    before((done) => {
      c2s = startServer(XOAuth2)
      done()
    })

    after((done) => {
      c2s.end(done)
    })

    /*
     * Google talk is replaced by google hangout,
     * but we can support the protocol anyway
     */
    it('should accept google authentication', (done) => {
      cl = createClient({
        jid: 'me@gmail.com',
        /* eslint-disable camelcase */
        oauth2_token: 'xxxx.xxxxxxxxxxx', // From OAuth2
        oauth2_auth: 'http://www.google.com/talk/protocol/auth',
        /* eslint-enable camelcase */
        host: 'localhost',
      })

      cl.on('online', () => {
        done()
      })
      cl.on('error', (e) => {
        console.log(e)
        done(e)
      })
    })
  })

  describe('DIGEST MD5', () => {
    let c2s = null
    let cl = null

    afterEach((done) => {
      cl.once('offline', done)
      cl.end()
    })

    before((done) => {
      c2s = startServer(DigestMD5)
      done()
    })

    after((done) => {
      c2s.end(done)
    })

    it('should accept digest md5 authentication', (done) => {
      cl = createClient({
        jid: user.jid,
        password: user.password,
        preferred: 'DIGEST-MD5',
      })

      cl.on('online', () => {
        done()
      })
      cl.on('error', (e) => {
        console.log(e)
        done(e)
      })
    })

    it('should not allow to skip digest md5 challenges', (done) => {
      // Preparing a sequence of stanzas to send
      const handshakeStanza = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<stream:stream to="localhost" xmlns="jabber:client" ' +
        'xmlns:stream="http://etherx.jabber.org/streams" ' +
        'xml:l="en" version="1.0">'

      const authStanza = '<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" ' +
        'mechanism="DIGEST-MD5"/>'

      const earlyAccessStanza = '<response ' +
        'xmlns="urn:ietf:params:xml:ns:xmpp-sasl"/>'

      /*
       * We cannot use existing client realization
       * because we need to skip challenge response
       */
      var client = net.connect({port: c2s.options.port}, () => {
        client.write(handshakeStanza, () => {
          client.write(authStanza, () => {
            client.write(earlyAccessStanza, () => {
              // Send earlyAccessStanza to receive 'success'
              client.write(earlyAccessStanza)
            })
          })
        })
      })

      let receivedData = ''

      client.on('data', (data) => {
        receivedData += data
      })

      client.setTimeout(500, () => {
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

  describe('ANONYMOUS', () => {
    let c2s = null
    let cl = null

    afterEach((done) => {
      cl.once('offline', done)
      cl.end()
    })

    before((done) => {
      c2s = startServer(Anonymous)
      done()
    })

    after((done) => {
      c2s.end(done)
    })

    it('should accept anonymous authentication', (done) => {
      cl = createClient({
        jid: '@localhost',
        preferred: Anonymous.id,
      })

      const defaultHatRackHashLength = rack()().length
      cl.on('online', (online) => {
        online.jid.local.length.should.equal(defaultHatRackHashLength)
        online.jid.resource.length.should.equal(defaultHatRackHashLength)
        done()
      })
      cl.on('error', (e) => {
        console.log(e)
        done(e)
      })
    })
  })
})
