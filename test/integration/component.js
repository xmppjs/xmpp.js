'use strict'

var XMPP = require('../..')
  , Server = XMPP.component.Server
  , Component = require('node-xmpp-component')

var server = new Server({
    autostart: false
})
server.on('connection', function(connection) {
    connection.on('verify-component', function(jid, cb) {
        cb(null, 'password')
    })

    connection.on('stanza', function(stanza) {
        stanza.attrs.from = server.jid
        stanza.attrs.to = connection.jid
        connection.send(stanza)
    })
})

describe('component server - component', function() {

    describe('server', function() {
        it('should listen', function(done) {
            server.listen(done)
        })
    })

    describe('component', function() {
        it('should connect', function(done) {
            var component = new Component({
                jid: 'foo.localhost',
                password: 'password',
                host: 'localhost',
                port: 5347
            })
            component.on('error', done)
            component.on('online', done)
        })
    })
})
