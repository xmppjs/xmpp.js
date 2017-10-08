'use strict'

/* global describe, it */

var assert = require('assert')
var Server = require('../../lib/Server')
var EventEmitter = require('events').EventEmitter
var sinon = require('sinon')

describe('Server', function () {
  it('is an instance of EventEmitter', function () {
    var s = new Server()
    assert(s instanceof EventEmitter)
  })
  it('has a connections property', function () {
    var s = new Server()
    assert(s.connections instanceof global.Set)
    assert.equal(s.connections.size, 0)
  })
  describe('options', function () {
    it('accepts and sets options from argument', function () {
      var options = {}
      var s = new Server(options)
      assert.equal(s.options, options)
    })
    it('defaults to an empty object', function () {
      var s = new Server({})
      assert.equal(typeof s.options, 'object')
      assert.notEqual(s.options, null)
      assert.equal(Object.keys(s.options), 0)
    })
  })
  it('handles connections', function (done) {
    var s = new Server()
    var conn = new EventEmitter()
    s.on('connect', function (connection) {
      assert.equal(connection, conn)
      done()
    })
    s.emit('connection', conn)
    assert(s.connections.has(conn))
  })
  it('handles disconnections', function () {
    var s = new Server()
    var conn = new EventEmitter()
    s.emit('connection', conn)
    assert(s.connections.has(conn))
    conn.emit('close')
    assert(!s.connections.has(conn))
  })
  describe('end', function () {
    it('closes the server, ends connections and calls back', function () {
      var s = new Server()
      s.close = sinon.stub()

      var conn = new EventEmitter()
      conn.end = sinon.spy()
      s.emit('connection', conn)
      assert(s.connections.has(conn))
      var cb = sinon.stub()

      s.end(cb)
      assert(s.close.calledOnce)
      assert(conn.end.calledOnce)
      assert(!s.connections.has(conn))
      s.emit('close')
      s.emit('close')
      assert(cb.calledOnce)
    })
  })
  describe('shutdown', function () {
    it('is an alias to end', function () {
      assert.equal(Server.prototype.shutdown, Server.prototype.end)
    })
  })
})
