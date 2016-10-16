/* global describe, it, before, after */

'use strict'

var Client = require('../index')
var net = require('net')
var ltx = Client.ltx
require('should')

describe('Authentication', function () {
  var C2S_PORT = 5225
  var onSocket = function () {}
  var duringafter = false
  var server = null

  before(function (done) {
    server = net.createServer(function (socket) {
      server.on('shutdown', function () {
        socket.end()
      })
      onSocket(socket)
    })
    server.listen(C2S_PORT, 'localhost')
    done()
  })

  after(function (done) {
    duringafter = true
    server.emit('shutdown')
    server.close(done)
  })

  it('Sends opening <stream/>', function (done) {
    var options = {
      jid: 'test@localhost',
      password: 'test',
      port: C2S_PORT,
      host: 'localhost'
    }
    onSocket = function (socket) {
      socket.once('data', function (d) {
        var element = ltx.parse(d.toString('utf8') + '</stream:stream>')
        element.is('stream').should.be.true
        element.attrs.to.should.equal(options.host)
        element.attrs.xmlns.should.equal('jabber:client')
        element.attrs['xmlns:stream']
          .should.equal('http://etherx.jabber.org/streams')
        element.attrs.version.should.equal('1.0')
        done()
      })
      socket.on('end', function () { // client disconnects
        if (duringafter) return
        done('error: socket closed')
      })
    }
    var client = new Client(options)
    client.should.exist
  })
})
