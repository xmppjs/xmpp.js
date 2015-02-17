'use strict';

var assert = require('assert')
  , xmpp = require('../index')
  , net = require('net')
  , ltx = require('ltx')

var PORT = 8084 //Tests create a server on this port to attach sockets to

describe('Connection', function () {
    describe('socket config', function () {
        it('allows a socket to be provided', function () {
            var socket = new net.Socket()
            var conn = new xmpp.Connection()
            conn.connect({socket: socket})

            assert.equal(conn.socket, socket)
        })
        it('allows a socket to be provided lazily', function () {
            var socket = new net.Socket()
            var socketFunc = function () {
                return socket;
            }
            var conn = new xmpp.Connection()
            conn.connect({
                socket: socketFunc
            })

            assert.equal(conn.socket, socket)
        })
        it('defaults to using a net.Socket', function () {
            var conn = new xmpp.Connection()
            conn.connect({})

            assert.equal(conn.socket instanceof net.Socket, true)
        })
    });

    describe('<stream> handling', function () {
        var conn
        var server
        var serverSocket

        beforeEach(function (done) {
            serverSocket = null
            server = net.createServer(function (c) {
                if(serverSocket) {
                    assert.fail('Multiple connections to server; test case fail')
                }
                serverSocket = c

                done()
            });
            server.listen(PORT)

            conn = new xmpp.Connection()
            var socket = new net.Socket()
            conn.connect({socket: socket})
            
            socket.connect(PORT)
        })

        afterEach(function (done) {
            serverSocket.end()
            server.close(done)
        })

        it('sends <stream:stream > to start the stream', function (done) {
            conn.startStream()

            serverSocket.on('data', function (data) {
                assert.equal(data.toString().indexOf('<stream:stream '), 0)
                done()
            })
        })

        it('sends </stream:stream> to close the stream when the connection is ended', function (done) {
            serverSocket.on('data', function (data) {
                var parsed = ltx.parse(data)
                assert.equal(parsed.name, 'stream:stream')
                done()
            })

            conn.startStream()

            conn.end()
        })

        it('sends </stream:stream> to close the stream when the socket is ended from the other side', function (done) {

            //If we don't allow halfOpen, the socket will close before it can send </stream>
            conn.socket.allowHalfOpen = true;
            conn.socket.on('end', function () {
                conn.socket.end()
            })

            serverSocket.on('data', function (data) {
                if(data.toString().indexOf('<stream:stream ') === 0) {
                    serverSocket.end()
                } else {
                    assert.equal(data.toString(), '</stream:stream>')
                    done()
                }
            })

            conn.startStream()
        })


    })
})