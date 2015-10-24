/* global describe, it */

'use strict'

describe('BOSH Browser tests', function () {
  var jid = Math.random().toString(36).substring(7) + '@localhost'
  var password = 'password'
  var client = null
  var resource = 'test'

  it('Can register an account', function (done) {
    client = new window.XMPP.Client({
      jid: jid,
      password: password,
      register: true,
      bosh: {
        url: 'http://localhost:5280/http-bind'
      },
      preferred: 'PLAIN'
    })
    client.on('error', function (error) {
      done(error)
    })
    client.on('online', function (data) {
      var bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      client.end()
      done()
    })
  })

  it('Errors on bad authentication details', function (done) {
    client = new window.XMPP.Client({
      jid: jid,
      password: 'not ' + password,
      bosh: {
        url: 'http://localhost:5280/http-bind/'
      },
      preferred: 'PLAIN'
    })
    client.on('online', function () {
      done('Should not have connected')
    })
    client.on('error', function (error) {
      error.should.equal(
        'XMPP authentication failure'
      )
      client.end()
      done()
    })
  })

  it('Can connect to an account with resource', function (done) {
    client = new window.XMPP.Client({
      jid: jid + '/' + resource,
      password: password,
      bosh: {
        url: 'http://localhost:5280/http-bind/'
      },
      preferred: 'PLAIN'
    })
    client.on('online', function (data) {
      var bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      data.jid.resource.should.equal(resource)
      client.end()
      done()
    })
  })

  it('Can connect to an account without resource', function (done) {
    client = new window.XMPP.Client({
      jid: jid,
      password: password,
      bosh: {
        url: 'http://localhost:5280/http-bind/'
      },
      preferred: 'PLAIN'
    })
    client.on('online', function (data) {
      var bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      bareJid = data.jid.local + '@' + data.jid.domain
      bareJid.should.equal(jid)
      data.jid.resource.should.exist
      client.end()
      done()
    })
  })

  it('Fails on registering a duplicate account', function (done) {
    client = new window.XMPP.Client({
      jid: jid,
      password: 'not ' + password,
      bosh: {
        url: 'http://localhost:5280/http-bind/'
      },
      register: true,
      preferred: 'PLAIN'
    })
    client.on('online', function () {
      done('Should not have connected')
    })
    client.on('error', function (error) {
      error.message.should.equal(
        'Registration error'
      )
      client.end()
      done()
    })
  })

  it('Can send and receive a stanza', function (done) {
    client = new window.XMPP.Client({
      jid: jid,
      password: password,
      bosh: {
        url: 'http://localhost:5280/http-bind/'
      },
      preferred: 'PLAIN'
    })

    var ping = new window.XMPP.ltx.Element(
      'iq', { id: '123', type: 'get' }
    ).c('ping', { xmlns: 'urn:xmpp:ping' })

    client.on('online', function () {
      client.send(ping)
      client.on('stanza', function (pong) {
        pong.attrs.id.should.equal('123')
        client.end()
        done()
      })
    })
  })

  it('Can send and receive stanzas', function (done) {
    client = new window.XMPP.Client({
      jid: jid,
      password: password,
      bosh: {
        url: 'http://localhost:5280/http-bind/'
      },
      preferred: 'PLAIN'
    })

    var ping = new window.XMPP.ltx.Element(
      'iq', { id: '123', type: 'get' }
    ).c('ping', { xmlns: 'urn:xmpp:ping' })

    var counter = 0
    client.on('online', function () {
      client.send(ping)
      client.on('stanza', function () {
        ++counter
        if (counter > 6) {
          client.end()
          return done()
        }
        client.send(ping)
      })
    })
    client.on('error', function (error) {
      done(error)
    })
  })

  it('Sends error for bad stanza', function (done) {
    client = new window.XMPP.Client({
      jid: jid,
      password: password,
      bosh: {
        url: 'http://localhost:5280/http-bind/'
      },
      preferred: 'PLAIN'
    })

    var badPing = new window.XMPP.ltx.Element(
      'wtf', { id: '123', type: 'get' }
    ).c('ping', { xmlns: 'urn:xmpp:ping' })

    client.on('online', function () {
      client.send(badPing)
      client.on('stanza', function (stanza) {
        stanza.attrs.type.should.equal('error')
        stanza.attrs.id.should.equal('123')
        client.end()
        done()
      })
    })
  })

  it('Errors when providing bad BOSH url', function (done) {
    client = new window.XMPP.Client({
      jid: jid,
      password: password,
      bosh: {
        url: 'http://localhost:5280/bosh-bind/'
      },
      preferred: 'PLAIN'
    })
    client.on('error', function (error) {
      error.message.should.exist
      client.end()
      done()
    })
    client.on('online', function () {
      done('Should not have connected')
    })
  })

  describe('Authentication', function () {
    it('Can connect using PLAIN authentication', function (done) {
      client = new window.XMPP.Client({
        jid: jid,
        password: password,
        bosh: {
          url: 'http://localhost:5280/http-bind/'
        },
        preferred: 'PLAIN'
      })

      var ping = new window.XMPP.ltx.Element(
        'iq', { id: '123', type: 'get' }
      ).c('ping', { xmlns: 'urn:xmpp:ping' })

      client.on('online', function () {
        client.send(ping)
        client.on('stanza', function (pong) {
          pong.attrs.id.should.equal('123')
          done()
        })
      })
    })

    it.skip('Can connect using DIGEST-MD5 authentication', function (done) {
      client = new window.XMPP.Client({
        jid: jid,
        password: password,
        bosh: {
          url: 'http://localhost:5280/http-bind/'
        },
        preferred: 'DIGEST-MD5'
      })

      var ping = new window.XMPP.ltx.Element(
        'iq', { id: '123', type: 'get' }
      ).c('ping', { xmlns: 'urn:xmpp:ping' })

      client.on('error', function (error) {
        done(error)
      })
      client.on('online', function () {
        client.send(ping)
        client.on('stanza', function (pong) {
          pong.attrs.id.should.equal('123')
          done()
        })
      })
    })

    it('Can connect using ANONYMOUS authentication', function (done) {
      client = new window.XMPP.Client({
        jid: '@anon.localhost',
        password: password,
        host: 'localhost',
        bosh: {
          url: 'http://localhost:5280/http-bind/'
        },
        preferred: 'ANONYMOUS'
      })

      var ping = new window.XMPP.ltx.Element(
        'iq', { id: '123', type: 'get' }
      ).c('ping', { xmlns: 'urn:xmpp:ping' })

      client.on('online', function () {
        client.send(ping)
        client.on('stanza', function (pong) {
          pong.attrs.id.should.equal('123')
          done()
        })
      })
    })
  })
})
