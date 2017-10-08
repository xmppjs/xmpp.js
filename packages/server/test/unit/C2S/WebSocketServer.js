'use strict'

/* global describe, it */

const Server = require('../../../lib/C2S/WebSocket/Server')
const C2SServer = require('../../../lib/C2S/Server')
const assert = require('assert')
const http = require('http')

describe('WebSocketServer', () => {
  it('is an instanceof C2SServer', () => {
    assert(new Server() instanceof C2SServer)
  })
  describe('server property', () => {
    it('uses the server provided as an option', () => {
      const httpServer = http.createServer()
      const server = new Server({server: httpServer})
      assert.equal(server.server, httpServer)
    })
    it('defaults to create its own http server', () => {
      const server = new Server()
      assert(server.server instanceof http.Server)
    })
  })
})
