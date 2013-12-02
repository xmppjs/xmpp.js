'use strict';

var xmpp = require('../index'),
    Client = require('node-xmpp-client'),
    Message = require('node-xmpp-core').Stanza.Message,
    Plain = require('../lib/authentication/plain'),
    XOAuth = require('../lib/authentication/xoauth2'),
    DigestMD5 = require('../lib/authentication/digestmd5')

var user = {
    jid: 'me@localhost',
    password: 'secret'
}

function startServer(mechanism) {

    // Sets up the server.
    var c2s = new xmpp.C2SServer({
        port: 5222,
        domain: 'localhost'
    })

    if (mechanism) {
        // remove plain
        c2s.availableSaslMechanisms = [];
        c2s.registerSaslMechanism(mechanism)
    }

    // Allows the developer to register the jid against anything they want
    c2s.on('register', function (opts, cb) {
        cb(true)
    })

    // On Connect event. When a client connects.
    c2s.on('connect', function (stream) {
        // That's the way you add mods to a given server.

        // Allows the developer to authenticate users against anything they want.
        stream.on('authenticate', function (opts, cb) {
            /*jshint camelcase: false */
            /*console.log("AUTHENTICATE METHOD")
            console.log("METHOD: %s", opts.saslmech);
            console.log("JID: %s", opts.jid);
            console.log("PASSWORD: %s", opts.password);
            console.log("OAUTH: %s", opts.oauth_token);
            */

            if ((opts.saslmech === 'PLAIN') &&
                (opts.jid.toString() === user.jid) &&
                (opts.password === user.password)) {
                //console.log('PLAIN OKAY')
                cb(null, opts)
            } else if ((opts.saslmech === 'X-OAUTH2') &&
                (opts.jid.toString() === 'me@gmail.com') &&
                (opts.oauth_token === 'xxxx.xxxxxxxxxxx')) {
                //console.log('OAUTH2 OKAY')
                cb(null, opts)
            } else if ((opts.saslmech === 'DIGEST-MD5') &&
                (opts.jid.toString() === user.jid)) {
                //console.log('DIGEST-MD5 OKAY')

                opts.password = "secret"
                cb(null, opts)
            } else {
                cb(new Error('Authentication failure'), null)
            }
        })

        stream.on('online', function () {
            stream.send(new Message({
                    type: 'chat'
                })
                .c('body')
                .t('Hello there, little client.')
            )
        })

        // Stanza handling
        stream.on('stanza', function () {
            //console.log('STANZA' + stanza)
        })

        // On Disconnect event. When a client disconnects
        stream.on('disconnect', function () {
            //console.log('DISCONNECT')
        })

    })

    return c2s
}

function registerHandler(cl) {

    cl.on(
        'stanza',
        function (stanza) {
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

describe('SASL', function () {
    describe('PLAIN', function () {
        var c2s = null

        before(function (done) {
            c2s = startServer(Plain)
            done()
        })

        after(function (done) {
            c2s.shutdown()
            done()
        })

        it('should accept plain authentication', function (done) {
            var cl = new Client({
                jid: user.jid,
                password: user.password,
                preferred: 'PLAIN'
            })

            registerHandler(cl)

            cl.on('online', function () {
                done()
            })
            cl.on('error', function (e) {
                console.log(e)
                done(e)
            })

        })

        it('should not accept plain authentication', function (done) {
            var cl = new Client({
                jid: user.jid,
                password: 'secretsecret'
            })

            registerHandler(cl)

            cl.on('online', function () {
                done('user is not valid')
            })
            cl.on('error', function () {
                // this should happen
                done()
            })

        })
    })

    describe('XOAUTH-2', function () {
        var c2s = null

        before(function (done) {
            c2s = startServer(XOAuth)
            done()
        })

        after(function (done) {
            c2s.shutdown()
            done()
        })

        /*
         * google talk is replaced by google hangout,
         * but we can support the protocol anyway
         */
        it('should accept google authentication', function (done) {
            /*jshint camelcase: false */
            var gtalk = new Client({
                jid: 'me@gmail.com',
                oauth2_token: 'xxxx.xxxxxxxxxxx', // from OAuth2
                oauth2_auth: 'http://www.google.com/talk/protocol/auth',
                host: 'localhost'
            })

            registerHandler(gtalk)

            gtalk.on('online', function () {
                done()
            })
            gtalk.on('error', function (e) {
                console.log(e)
                done(e)
            })
        })

    })

    describe('DIGEST MD5', function () {
        var c2s = null

        before(function (done) {
            c2s = startServer(DigestMD5);

            c2s.on('connect', function (stream) {

                stream.on('authenticate-digestmd5', function (opts, cb) {
                    console.log("authenticate-digestmd5 %s", JSON.stringify(opts));
                    if (opts === 'me') {
                        cb('secret');
                    } else {
                        cb();
                    }                    
                });
            })

            done()
        })

        after(function (done) {
            c2s.shutdown()
            done()
        })


        it('should accept digest md5 authentication', function (done) {
            var cl = new Client({
                jid: user.jid,
                password: user.password,
                preferred: 'DIGEST-MD5'
            })

            registerHandler(cl)

            cl.on('online', function () {
                done()
            })
            cl.on('error', function (e) {
                console.log(e)
                done(e)
            })

        })
    })
})