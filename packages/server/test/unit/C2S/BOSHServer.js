'use strict'

/* global describe, it */

const Server = require('../../../lib/C2S/BOSH/Server')
const BOSHServer = require('../../../lib/C2S/BOSH/BOSHServer')
const C2SServer = require('../../../lib/C2S/Server')
const assert = require('assert')
const http = require('http')

describe('BOSHServer', () => {
  it('is an instanceof C2SServer', () => {
    assert(new Server() instanceof C2SServer)
  })
  describe('server property', () => {
    it('is a BOSHServer instance', () => {
      const server = new Server()
      assert(server.server instanceof BOSHServer)
    })
    it('uses the server provided as an option', () => {
      const httpServer = http.createServer()
      const server = new Server({server: httpServer})
      assert.equal(server.server.server, httpServer)
    })
    it('defaults to create its own http server', () => {
      const server = new Server()
      assert(server.server.server instanceof http.Server)
    })
  })
})
