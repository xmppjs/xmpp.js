'use strict'

/* global describe, it */

const Server = require('../../../lib/C2S/TCP/Server')
const C2SServer = require('../../../lib/C2S/Server')
const assert = require('assert')
const net = require('net')

describe('BOSHServer', () => {
  it('is an instanceof C2SServer', () => {
    assert(new Server() instanceof C2SServer)
  })
  describe('server property', () => {
    it('uses the server provided as an option', () => {
      const httpServer = net.createServer()
      const server = new Server({server: httpServer})
      assert.equal(server.server, httpServer)
    })
    it('defaults to create its own net server', () => {
      const server = new Server()
      assert(server.server instanceof net.Server)
    })
  })
})
