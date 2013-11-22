'use strict';

var xmpp = require('../index')
  , XOAuth = require('node-xmpp-core/lib/authentication/xoauth2')

var user = {
    jid: 'me@localhost',
    password: 'secret'
}

var c2s = null

function startServer() {

    // Sets up the server.
    c2s = new xmpp.C2SServer({
        port: 5222,
        domain: 'localhost'
    })

    c2s.registerSaslMechanism(new XOAuth())

    // On Connect event. When a client connects.
    c2s.on('connect', function(client) {
        // That's the way you add mods to a given server.

        // Allows the developer to register the jid against anything they want
        c2s.on('register', function(opts, cb) {
            cb(true)
        })

        // Allows the developer to authenticate users against anything they want.
        client.on('authenticate', function(opts, cb) {
            /*jshint camelcase: false */
            if ((opts.saslmech = 'PLAIN') &&
                (opts.jid.toString() === user.jid) &&
                (opts.password === user.password)) {
                cb(false)
            } else if ((opts.saslmech = 'X-OAUTH2') &&
               (opts.jid.toString() === 'me@gmail.com@gmail.com') &&
               (opts.oauth_token === 'xxxx.xxxxxxxxxxx')) {
                cb(false)
            } else {
                cb(new Error('Authentication failure'))
            }
        })

        client.on('online', function() {
            client.send(new xmpp.Message({ type: 'chat' })
                .c('body')
                .t('Hello there, little client.')
            )
        })

        // Stanza handling
        client.on('stanza', function() {
            //console.log('STANZA' + stanza)
        })

        // On Disconnect event. When a client disconnects
        client.on('disconnect', function() {
            //console.log('DISCONNECT')
        })

    })

    return c2s
}

function registerHandler(cl) {

    cl.on(
        'stanza',
        function(stanza) {
            if (stanza.is('message') &&
                // Important: never reply to errors!
                (stanza.attrs.type !== 'error')) {

                // Swap addresses...
                stanza.attrs.to = stanza.attrs.from
                delete stanza.attrs.from
                // and send back.
                cl.send(stanza)
            }
        }
    )
}


describe('SASL', function() {

    before(function(done) {
        startServer()
        done()
    })

    after(function(done) {
        c2s.shutdown()
        done()
    })

    describe('server', function() {
        it('should accept plain authentication', function(done) {
            var cl = new xmpp.Client({
                jid: user.jid,
                password: user.password
            })

            registerHandler(cl)

            cl.on('online', function() {
                done()
            })
            cl.on('error', function(e) {
                console.log(e)
                done(e)
            })

        })

        it('should not accept plain authentication', function(done) {
            var cl = new xmpp.Client({
                jid: user.jid,
                password: 'secretsecret'
            })

            registerHandler(cl)

            cl.on('online', function() {
                done('user is not valid')
            })
            cl.on('error', function() {
                // this should happen
                done()
            })

        })

        /*
         * google talk is replaced by google hangout,
         * but we can support the protocol anyway
         */
        it('should accept google authentication', function(done) {
            /*jshint camelcase: false */
            var gtalk = new xmpp.Client({
                jid: 'me@gmail.com',
                oauth2_token: 'xxxx.xxxxxxxxxxx', // from OAuth2
                oauth2_auth: 'http://www.google.com/talk/protocol/auth',
                host: 'localhost'
            })

            registerHandler(gtalk)

            gtalk.on('online', function() {
                done()
            })
            gtalk.on('error', function(e) {
                console.log(e)
                done(e)
            })
        })
    })
})
