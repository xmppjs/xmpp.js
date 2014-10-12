'use strict';

var Client = require('../../index')
  , net = require('net')
  , ltx = require('ltx')
require('should')

/* jshint -W030 */
describe('Authentication', function() {

    var C2S_PORT = 5222
    var onSocket = function () { }
    var duringafter = false
    var server = null

    before(function(done) {
        server = net.createServer(function (socket) {
            server.on('shutdown', function () {
                socket.end()
            })
            onSocket(socket)
        })
        server.listen(C2S_PORT, 'localhost')
        done()
    })

    after(function(done) {
        duringafter = true
        server.emit('shutdown')
        server.close(done)
    })

    it('Sends opening <stream/>', function(done) {
        var options = {
            jid: 'test@localhost',
            password: 'test',
            host: 'localhost',
            port: C2S_PORT
        }
        onSocket = function(socket) {
            socket.once('data', function(d) {
                var element = new ltx.parse(d.toString('utf8') + '</stream:stream>')
                element.is('stream').should.be.true
                element.attrs.to.should.equal(options.host)
                element.attrs.xmlns.should.equal('jabber:client')
                element.attrs['xmlns:stream']
                    .should.equal('http://etherx.jabber.org/streams')
                element.attrs.version.should.equal('1.0')
                done()
            })
            socket.on('end', function() { // client disconnects
                if (duringafter) return
                done('error: socket closed')
            })
        }
        var client = new Client(options)
        client.should.exist
    })
})
