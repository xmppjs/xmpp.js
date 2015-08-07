'use strict'

var XMPP = require('../../..')
  , Server = XMPP.C2S.TCPServer
  , Plain = XMPP.auth.Plain
  , JID = XMPP.JID
  , Client = require('node-xmpp-client')

var port = 5222
var user = {
    jid: new JID('me@localhost/res'),
    password: 'secret'
}

function startServer(action) {
    var server = new Server({
        port: port,
        domain: 'localhost'
    })

    server.on('connect', function(stream) {
        stream.on('authenticate', function(opts, cb) {
            cb(null, opts)
        })
        stream.on('register', function(data, cb) {
            if (action === 'fail') {
                cb({
                    code: 503,
                    type: 'cancel',
                    condition: 'service-unavailable',
                    text: 'Test error'
                }, null)
            } else {
                cb(null)
            }
        })
    })

    return server
}

function startClient(cb) {
    var client = new Client({
        jid: user.jid,
        password: user.password,
        preferred: Plain.id,
        register: true
    })

    client.on('online', function() {
        cb(null)
    })
    client.on('error', function(error) {
        cb(error)
    })

    return client
}

describe('Stream register', function() {
    var server

    afterEach(function(done) {
        server.end(done)
    })

    it('Should redister', function(done) {
        server = startServer('unmodified')
        startClient(function(error) {
            if (error) {
                done(error)
            } else {
                done()
            }
        })
    })

    it('Should not register', function(done) {
        server = startServer('fail')
        startClient(function(error) {
            if (!error) {
                done(new Error('No error'))
            } else {
                done()
            }
        })
    })
})
