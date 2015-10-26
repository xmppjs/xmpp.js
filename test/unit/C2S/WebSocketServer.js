'use strict'

/* global describe, it */

var Server = require('../../../lib/C2S/WebSocket/Server')
var C2SServer = require('../../../lib/C2S/Server')
var assert = require('assert')
var http = require('http')

describe('WebSocketServer', function () {
  it('is an instanceof C2SServer', function () {
    assert(new Server() instanceof C2SServer)
  })
  describe('server property', function () {
    it('uses the server provided as an option', function () {
      var httpServer = http.createServer()
      var server = new Server({server: httpServer})
      assert.equal(server.server, httpServer)
    })
    it('defaults to create its own http server', function () {
      var server = new Server()
      assert(server.server instanceof http.Server)
    })
  })
})
