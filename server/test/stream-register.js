'use strict';

var C2SServer = require('../index').C2SServer
  , Client = require('node-xmpp-client')
  , Plain = require('../index').auth.Plain
  , JID = require('node-xmpp-core').JID

var port = 5222
var user = {
    jid: new JID('me@localhost/res'),
    password: 'secret'
}

function startServer(action) {
    var c2s = new C2SServer({
        port: port,
        domain: 'localhost'
    })

    c2s.on('connect', function(stream) {
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
        });
    })

    return c2s
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
    var c2s
    var client

    afterEach(function(done) {
        c2s.shutdown(done)
    })

    it('Should redister', function(done) {
        c2s = startServer('unmodified')
        client = startClient(function(error) {
            if (error) {
                done(error)
            } else {
                done()
            }
        })
    })

    it('Should not register', function(done) {
        c2s = startServer('fail')
        client = startClient(function(error) {
            if (!error) {
                done(new Error('No error'))
            } else {
                done()
            }
        })
    })
})
