'use strict'

/* global describe, it */

const assert = require('assert')
const Server = require('../../lib/Server')
const { EventEmitter } = require('@xmpp/events')
const sinon = require('sinon')

describe('Server', () => {
  it('is an instance of EventEmitter', () => {
    const s = new Server()
    assert(s instanceof EventEmitter)
  })
  it('has a connections property', () => {
    const s = new Server()
    assert(s.connections instanceof global.Set)
    assert.equal(s.connections.size, 0)
  })
  describe('options', () => {
    it('accepts and sets options from argument', () => {
      const options = {}
      const s = new Server(options)
      assert.equal(s.options, options)
    })
    it('defaults to an empty object', () => {
      const s = new Server({})
      assert.equal(typeof s.options, 'object')
      assert.notEqual(s.options, null)
      assert.equal(Object.keys(s.options), 0)
    })
  })
  it('handles connections', (done) => {
    const s = new Server()
    const conn = new EventEmitter()
    s.on('connect', (connection) => {
      assert.equal(connection, conn)
      done()
    })
    s.emit('connection', conn)
    assert(s.connections.has(conn))
  })
  it('handles disconnections', () => {
    const s = new Server()
    const conn = new EventEmitter()
    s.emit('connection', conn)
    assert(s.connections.has(conn))
    conn.emit('close')
    assert(!s.connections.has(conn))
  })
  describe('end', () => {
    it('closes the server, ends connections and calls back', () => {
      const s = new Server()
      s.close = sinon.stub()

      const conn = new EventEmitter()
      conn.end = sinon.spy()
      s.emit('connection', conn)
      assert(s.connections.has(conn))
      const cb = sinon.stub()

      s.end(cb)
      assert(s.close.calledOnce)
      assert(conn.end.calledOnce)
      assert(!s.connections.has(conn))
      s.emit('close')
      s.emit('close')
      assert(cb.calledOnce)
    })
  })
  describe('shutdown', () => {
    it('is an alias to end', () => {
      assert.equal(Server.prototype.shutdown, Server.prototype.end)
    })
  })
})
