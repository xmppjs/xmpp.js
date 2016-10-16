/* global describe, it, beforeEach, afterEach */

'use strict'

var assert = require('assert')
var Connection = require('..').Connection
var sinon = require('sinon')
var net = require('net')
var parse = require('@xmpp/xml').parse

var PORT = 8084 // Tests create a server on this port to attach sockets to

describe('Connection', function () {
  describe('socket config', function () {
    it('allows a socket to be provided', function () {
      var socket = new net.Socket()
      var conn = new Connection()
      conn.connect({socket: socket})

      assert.equal(conn.socket, socket)
    })
    it('allows a socket to be provided lazily', function () {
      var socket = new net.Socket()
      var socketFunc = function () {
        return socket
      }
      var conn = new Connection()
      conn.connect({
        socket: socketFunc
      })

      assert.equal(conn.socket, socket)
    })
    it('defaults to using a net.Socket', function () {
      var conn = new Connection()
      conn.connect({})

      assert.equal(conn.socket instanceof net.Socket, true)
    })
  })

  describe('streamOpen', function () {
    it('defaults to stream:stream', function () {
      var conn = new Connection()
      assert.equal(conn.streamOpen, 'stream:stream')
    })
    it('is configurable', function () {
      var conn = new Connection({streamOpen: 'open'})
      assert.equal(conn.streamOpen, 'open')
    })
  })

  describe('streamClose', function () {
    it('defaults to </stream:stream>', function () {
      var conn = new Connection()
      assert.equal(conn.streamClose, '</stream:stream>')
    })
    it('is configurable', function () {
      var conn = new Connection({streamClose: '<close/>'})
      assert.equal(conn.streamClose, '<close/>')
    })
  })

  // http://xmpp.org/rfcs/rfc6120.html#streams-open
  describe('openStream', function () {
    it('calls send with <streamOpen >', function () {
      var conn = new Connection()
      conn.streamOpen = 'foo'
      var send = sinon.stub(conn, 'send')
      conn.openStream()
      assert(send.calledOnce)
      assert.equal(send.args[0][0].indexOf('<' + conn.streamOpen + ' '), 0)
    })

    it('alias to startStream', function () {
      var conn = new Connection()
      assert.equal(conn.startStream, conn.openStream)
    })
  })

  // http://xmpp.org/rfcs/rfc6120.html#streams-close
  describe('closeStream', function () {
    it('calls sends with streamClose', function () {
      var conn = new Connection()
      conn.openStream()
      conn.streamClose = '</bar>'
      var send = sinon.stub(conn, 'send')
      conn.closeStream()
      assert(send.calledOnce)
      assert(send.calledWith(conn.streamClose))
    })

    it('alias to endStream', function () {
      var conn = new Connection()
      assert.equal(conn.endStream, conn.closeStream)
    })
  })

  describe('<stream> handling', function () {
    var conn
    var server
    var serverSocket

    beforeEach(function (done) {
      serverSocket = null
      server = net.createServer(function (c) {
        if (serverSocket) {
          assert.fail('Multiple connections to server; test case fail')
        }
        serverSocket = c

        done()
      })
      server.listen(PORT)

      conn = new Connection()
      var socket = new net.Socket()
      conn.connect({socket: socket})

      socket.connect(PORT)
    })

    afterEach(function (done) {
      serverSocket.end()
      server.close(done)
    })

    it('sends <stream:stream > to start the stream', function (done) {
      conn.openStream()

      serverSocket.on('data', function (data) {
        assert.equal(data.toString().indexOf('<stream:stream '), 0)
        done()
      })
    })

    it('sends </stream:stream> to close the stream when the connection is ended', function (done) {
      serverSocket.on('data', function (data) {
        var parsed = parse(data)
        assert.equal(parsed.name, 'stream:stream')
        done()
      })

      conn.openStream()

      conn.end()
    })

    it('sends </stream:stream> to close the stream when the socket is ended from the other side', function (done) {
      // If we don't allow halfOpen, the socket will close before it can send </stream>
      conn.socket.allowHalfOpen = true
      conn.socket.on('end', function () {
        conn.socket.end()
      })

      serverSocket.on('data', function (data) {
        if (data.toString().indexOf('<stream:stream ') === 0) {
          serverSocket.end()
        } else {
          assert.equal(data.toString(), '</stream:stream>')
          done()
        }
      })

      conn.startStream()
    })
  })
})
