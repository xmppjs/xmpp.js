'use strict'

/* global describe, it */

var assert = require('assert')
var Server = require('../../../lib/Server')
var ComponentServer = require('../../../lib/component/Server')
var ComponentSession = require('../../../lib/component/Session')
var net = require('net')

describe('component Server', function () {
  it('is an instance of Server', function () {
    var s = new ComponentServer()
    assert(s instanceof Server)
  })
  it('has component Session as default session', function () {
    assert.equal(ComponentServer.prototype.Session, ComponentSession)
  })
  describe('server property', function () {
    it('uses the server provided as an option', function () {
      var httpServer = net.createServer()
      var server = new ComponentServer({server: httpServer})
      assert.equal(server.server, httpServer)
    })
    it('defaults to create its own net server', function () {
      var server = new ComponentServer()
      assert(server.server instanceof net.Server)
    })
  })
})
