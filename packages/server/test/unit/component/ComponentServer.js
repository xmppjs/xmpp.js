'use strict'

/* global describe, it */

const assert = require('assert')
const Server = require('../../../lib/Server')
const ComponentServer = require('../../../lib/component/Server')
const ComponentSession = require('../../../lib/component/Session')
const net = require('net')

describe('component Server', () => {
  it('is an instance of Server', () => {
    const s = new ComponentServer()
    assert(s instanceof Server)
  })
  it('has component Session as default session', () => {
    assert.equal(ComponentServer.prototype.Session, ComponentSession)
  })
  describe('server property', () => {
    it('uses the server provided as an option', () => {
      const httpServer = net.createServer()
      const server = new ComponentServer({server: httpServer})
      assert.equal(server.server, httpServer)
    })
    it('defaults to create its own net server', () => {
      const server = new ComponentServer()
      assert(server.server instanceof net.Server)
    })
  })
})
