'use strict'

/* global describe, it, before, after */

var Component = require('../index')
var parse = Component.parse
var net = require('net')
var crypto = require('crypto')
var assert = require('assert')

require('should')

describe('connection', function () {
  var COMPONENT_PORT = 5348
  var onSocket = function () {}
  var duringafter = false
  var server = null

  before(function (done) {
    server = net.createServer(function (socket) {
      server.on('shutdown', function () {
        socket.end()
      })
      onSocket(socket)
    })
    server.listen(COMPONENT_PORT, 'localhost')
    done()
  })

  after(function (done) {
    duringafter = true
    server.emit('shutdown')
    server.close(done)
  })

  var options = {
    jid: 'component.shakespeare.lit',
    password: 'shared-password',
    host: 'localhost',
    port: COMPONENT_PORT
  }

  it('Sends opening <stream/>', function (done) {
    onSocket = function (socket) {
      socket.once('data', function (d) {
        var element = parse(d.toString('utf8') + '</stream:stream>')
        element.is('stream').should.be.true
        element.attrs.to.should.equal(options.jid)
        element.attrs.xmlns.should.equal(component.NS_COMPONENT)
        element.attrs['xmlns:stream']
          .should.equal(component.NS_STREAM)
        done()
      })
      socket.on('end', function () { // client disconnects
        if (duringafter) return
        done('error: socket closed')
      })
    }
    var component = new Component(options)
    component.should.exist
  })

  it('Sends handshake', function (done) {
    onSocket = function (socket) {
      socket.once('data', function () {
        socket.once('data', function (d) {
          var handshake = parse(d.toString('utf8'))
          handshake.is('handshake').should.be.true
          var shasum = crypto.createHash('sha1')
          shasum.update(555 + options.password)
          var expected = shasum.digest('hex').toLowerCase()
          handshake.getText().should.equal(expected)
          done()
        })
        component.connection.emit('streamStart', { from: 'shakespeare.lit', id: 555 })
      })
      socket.on('end', function () { // client disconnects
        if (duringafter) return
        done('error: socket closed')
      })
    }
    var component = new Component(options)
    component.should.exist
  })

  it("Reports 'connected' once connected", function (done) {
    onSocket = function (socket) {
      socket.once('data', function () {
        socket.once('data', function () {
          component.connection.emit('stanza', parse('<handshake/>'))
        })
        component.connection.emit('streamStart', { from: 'shakespeare.lit', id: 555 })
      })
      socket.on('end', function () { // client disconnects
        if (duringafter) return
        done('error: socket closed')
      })
    }
    var component = new Component(options)
    component.should.exist
    component.on('online', function () {
      done()
    })
  })

  it('Handles failed bad handshake', function (done) {
    var streamError = 'urn:ietf:params:xml:ns:xmpp-streams'
    var errorMessage = 'Given token does not match calculated token'
    var badHandshakeStanza = '<stream:error>' +
      '<not-authorized xmlns="' + streamError + '"/>' +
      '<text xmlns="' + streamError + '">' + errorMessage + '</text>' +
      '</stream:error>'
    onSocket = function (socket) {
      socket.once('data', function () {
        socket.once('data', function () {
          component.connection.parser.emit('stanza', parse(badHandshakeStanza))
        })
        component.connection.parser.emit(
          'streamStart',
          {
            from: 'shakespeare.lit',
            id: 555,
            'xmlns:stream': 'http://etherx.jabber.org/streams'
          }
        )
      })
      socket.on('end', function () { // client disconnects
        if (duringafter) return
        done('error: socket closed')
      })
    }
    var component = new Component(options)
    component.should.exist
    component.on('disconnect', function (error) {
      error.stanza.is('error').should.be.true
      error.stanza.getChild('not-authorized').should.exist
      error.stanza.getChildText('text', streamError).should.equal(errorMessage)
      error.message.should.equal(errorMessage)
      done()
    })
  })

  describe('send', function () {
    it('adds the from attribute if missing', function (done) {
      var component = new Component(options)
      onSocket = function (socket) {
        socket.once('data', function (d) {
          component.emit('online')
          socket.on('data', function (data) {
            var stanza = parse(data.toString())
            assert(stanza.is('foo'))
            var from = stanza.attrs.from
            assert.equal(typeof from, 'string')
            assert(from.length > 0)
            assert.equal(from, component.connection.jid.toString())
            done()
          })
        })
      }
      component.once('online', function () {
        component.send(parse('<foo/>'))
      })
    })

    it('does not set the from attribute if present', function (done) {
      var component = new Component(options)
      onSocket = function (socket) {
        socket.once('data', function (d) {
          component.emit('online')
          socket.on('data', function (data) {
            var stanza = parse(data.toString())
            assert(stanza.is('foo'))
            var from = stanza.attrs.from
            assert.equal(from, 'foo@bar')
            done()
          })
        })
      }
      component.once('online', function () {
        component.send(parse('<foo from="foo@bar"/>'))
      })
    })
  })
})
