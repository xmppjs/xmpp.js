'use strict'

var Server = require('../../../lib/C2S/BOSH/Server')
  , C2SServer = require('../../../lib/C2S/Server')
  , assert = require('assert')
  , http = require('http')

describe('BOSHServer', function() {
    it('is an instanceof C2SServer', function() {
        assert(new Server() instanceof C2SServer)
    })
    describe('server property', function() {
        it('uses the server provided as an option', function() {
            var httpServer = http.createServer()
            var server = new Server({server: httpServer})
            assert.equal(server.server, httpServer)
        })
        it('defaults to create its own http server', function() {
            var server = new Server()
            assert(server.server instanceof http.Server)
        })
    })
})
