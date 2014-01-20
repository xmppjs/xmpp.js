'use strict';

var Client = require('../index')
  , net = require('net')
  , ltx = require('ltx')
require('should')

/* jshint -W030 */
describe('Authentication', function() {

    var C2S_PORT = 5222
    var server

    var getServer = function(callback) {
        server = net.createServer(callback)
        server.listen(C2S_PORT, 'localhost')
    }

    it('Sends opening <stream/>', function(done) {
        var options = {
            jid: 'test@localhost',
            password: 'test',
            host: 'localhost',
            port: C2S_PORT
        }
        getServer(function(socket) {
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
                done('error: socket closed')
            })
        })
        var client = new Client(options)
        client.should.exist
    })
})