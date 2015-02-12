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
        stream.on('bind', function(resource, cb) {
            if (action === 'fail') {
                cb({
                    type: 'cancel',
                    condition: 'not-allowed',
                    text: 'Test error'
                }, null)
            } else {
                cb(null, action === 'modified' ? resource + '-' + 'mod' : resource)
            }
        });
    })

    return c2s
}

function startClient(cb) {
    var client = new Client({
        jid: user.jid,
        password: user.password,
        preferred: Plain.id
    })

    client.on('online', function(data) {
        cb(null, data.jid.resource)
    })
    client.on('error', function(error) {
        cb(error, null)
    })

    return client
}

describe('Stream resource bind', function() {
    var c2s
    var client

    afterEach(function(done) {
        c2s.shutdown(done)
    })

    it('Should bind unmodified', function(done) {
        c2s = startServer('unmodified')
        client = startClient(function(error, resource) {
            if (error) {
                done(error)
            } else if (resource !== user.jid.resource) {
                done(new Error('Wrong resource: ' + resource))
            } else {
                done()
            }
        })
    })

    it('Should bind modified', function(done) {
        c2s = startServer('modified')
        client = startClient(function(error, resource) {
            if (error) {
                done(error)
            } else if (resource !== user.jid.resource + '-' + 'mod') {
                done(new Error('Wrong resource: ' + resource))
            } else {
                done()
            }
        })
    })

    it('Should not bind', function(done) {
        c2s = startServer('fail')
        client = startClient(function(error, resource) {
            /* jshint unused:false */
            if (!error) {
                done(new Error('No error'))
            } else {
                done()
            }
        })
    })
})
