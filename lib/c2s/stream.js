'use strict';

var Connection = require('node-xmpp-core').Connection,
    JID = require('node-xmpp-core').JID,
    ltx = require('ltx'),
    util = require('util'),
    sasl = require('../sasl');

var NS_CLIENT = 'jabber:client'
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'
var NS_REGISTER = 'jabber:iq:register'
var NS_SESSION = 'urn:ietf:params:xml:ns:xmpp-session'
var NS_BIND = 'urn:ietf:params:xml:ns:xmpp-bind'
var NS_STANZAS = 'urn:ietf:params:xml:ns:xmpp-stanzas'

function C2SStream(opts) {
    var self = this
    this.authenticated = false
    this.server = opts.server

    this.connection = opts.connection || new Connection({
        rejectUnauthorized: opts.rejectUnauthorized,
        requestCert: opts.requestCert,
        socket: opts.socket
    })
    if (this.connection.xmlns)
        this.connection.xmlns[''] = NS_CLIENT
    this.connection.streamAttrs.version = '1.0'
    this.connection.streamAttrs.id = this.generateId()

    this.connection.addListener('streamStart', function (streamAttrs) {
        self.serverdomain = streamAttrs.to
        self.connection.streamAttrs.from = streamAttrs.to
        self.startStream()
    })

    this.connection.addListener('stanza', function (stanza) {
        self.onStanza(stanza)
    })

    this.connection.addListener('end', function () {
        self.emit('end')
    })
    this.connection.addListener('close', function () {
        self.emit('close')
    })
    this.connection.addListener('error', function (e) {
        self.emit('error', e)
    })

    // if the server shuts down, we close all connections
    if (this.server) {
        this.server.addListener('shutdown', function () {
            if (this.connection) this.connection.end()
        })
    }
    return self
}

util.inherits(C2SStream, Connection)

C2SStream.prototype.send = function (stanza) {
    if (stanza.root) stanza = stanza.root()
    this.connection.send(stanza)
}

C2SStream.prototype.startStream = function () {
    if (this.connection.startStream)
        this.connection.startStream()
    this.sendFeatures()
}

C2SStream.prototype.generateId = function () {
    var r = new Buffer(16)
    for (var i = 0; i < r.length; i++) {
        r[i] = 48 + Math.floor(Math.random() * 10) // '0'..'9'
    }
    return r.toString()
}

C2SStream.prototype.decode64 = function (encoded) {
    return (new Buffer(encoded, 'base64')).toString('utf8')
}

C2SStream.prototype.sendFeatures = function () {
    var features = new ltx.Element('stream:features')
    if (!this.authenticated) {
        if (this.server) {
            // TLS
            if (this.server.options.tls && !this.connection.isSecure) {
                features
                    .c('starttls', {
                        xmlns: this.connection.NS_XMPP_TLS
                    })
                    .c('required')
            }
            this.mechanisms = sasl.availableMechanisms(
                this.server.availableSaslMechanisms)
        } else {
            this.mechanisms = sasl.availableMechanisms()
        }

        var mechanismsEl = features.c(
            'mechanisms', {
                xmlns: NS_XMPP_SASL
            })
        this.mechanisms.forEach(function (mech) {
            mechanismsEl.c('mechanism').t(mech.prototype.name)
        })
    } else {
        features.c('bind', {
            xmlns: NS_BIND
        })
        features.c('session', {
            xmlns: NS_SESSION
        })
    }
    this.send(features)
}

C2SStream.prototype.onStanza = function (stanza) {
    if (this.jid) stanza.attrs.from = this.jid.toString()


    if (stanza.is('starttls', this.connection.NS_XMPP_TLS)) {
        var toSend = new ltx.Element(
            'proceed', {
                xmlns: this.connection.NS_XMPP_TLS
            }
        )
        this.send(toSend)
        this.connection.setSecure(this.server.credentials, true)
        // FIXME: stop/startParser after 'secure'
    } else if (stanza.is('auth', NS_XMPP_SASL) || stanza.is('response', NS_XMPP_SASL)) {
        this.onAuth(stanza)
    } else if (stanza.is('iq') && stanza.getChild('query', NS_REGISTER)) {
        this.onRegistration(stanza)
    } else if (this.authenticated) {
        this.onAuthStanza(stanza)
    }
}

C2SStream.prototype.onAuthStanza = function (stanza) {
    var bind;
    if (stanza.is('iq') &&
        (stanza.attrs.type === 'set') &&
        (bind = stanza.getChild('bind', NS_BIND))) {
        this.onBind(stanza)
    } else if (stanza.is('iq') &&
        (stanza.attrs.type === 'set') &&
        stanza.getChild('session', NS_SESSION)) {
        this.onSession(stanza)
    } else {
        this.emit('stanza', stanza)
    }
}

C2SStream.prototype.sendAuthError = function(error) {
    if (this.jid) {
        this.emit('auth-failure', this.jid)
    }
    this.send(new ltx.Element('failure', {
        xmlns: NS_XMPP_SASL
    }).c('text').t(error.message))
}

C2SStream.prototype.onAuth = function(stanza) {
    var self = this

    // if we havn't already decided for one method
    if (!this.mechanism) {
        var matchingMechs = this.mechanisms.filter(function(mech) {
            return mech.prototype.name === stanza.attrs.mechanism
        })

        // TODO handle case where we are not able to match a sasl mechanism
        this.mechanism = new matchingMechs[0]();

        /**
         * Authenticates a user
         * @param  Object authRequest obejct with credentials like {user: 'bob', password: 'secret'}
         */
        this.mechanism.authenticate = function(user, cb) {
            if (user != null) {
                // attach sasl mechanism
                user.saslmech = self.mechanism.name
            }

            var jid = null;

            if (user.jid) {
                jid = new JID(user.jid);
            } else {
                jid = new JID(user.username, self.serverdomain ?
                    self.serverdomain.toString() : '')
            }
            user.jid = jid
            user.client = self

            // emit event
            self.emit(
                'authenticate',
                user,
                cb
            )
        }
        this.mechanism.success = function(user) {
            self.emit('auth-success', user.jid)
            self.jid = user.jid
            self.authenticated = true
            self.send(new ltx.Element('success', {
                xmlns: NS_XMPP_SASL
            }))
            // incoming stream restart
            if (self.connection.startParser)
                self.connection.startParser()
        }
        this.mechanism.failure = function(err) {
            self.sendAuthError(err);
        }
    }

    if (this.mechanism) {
        this.mechanism.manageAuth(stanza, this);
    }
}

C2SStream.prototype.onRegistration = function(stanza) {
    var self = this
    var register = stanza.getChild('query', NS_REGISTER)
    var reply = new ltx.Element('iq', {
        type: 'result'
    })
    if (stanza.attrs.id)
        reply.attrs.id = stanza.attrs.id

    if (stanza.attrs.type === 'get') {
        var instructions = 'Choose a username and password for use ' +
            'with this service. '
        reply.c('query', {
            xmlns: NS_REGISTER
        })
            .c('instructions').t(instructions).up()
            .c('username').up()
            .c('password')
    } else if (stanza.attrs.type === 'set') {
        var jid = new JID(register.getChildText('username'), this.server.options.domain)
        this.emit(
            'register', {
                jid: jid,
                username: register.getChildText('username'),
                password: register.getChildText('password'),
                client: self
            },
            function (error) {
                if (!error) {
                    self.emit('registration-success', self.jid)
                } else {
                    self.emit('registration-failure', jid)
                    reply.attrs.type = 'error'
                    reply
                        .c('error', {
                            code: '' + error.code,
                            type: error.type
                        })
                        .c('text', {
                            xmlns: NS_STANZAS
                        })
                        .t(error.message)
                }
            })
    }
    self.send(reply)
}

C2SStream.prototype.onBind = function(stanza) {
    var bind = stanza.getChild('bind', NS_BIND)
    var resource
    if ((resource = bind.getChild('resource', NS_BIND))) {
        this.jid.setResource(resource.getText())
    } else {
        this.jid.setResource(this.generateId())
    }

    this.send(
        new ltx.Element('iq', {
            type: 'result',
            id: stanza.attrs.id
        })
        .c('bind', {
            xmlns: NS_BIND
        })
        .c('jid').t(this.jid.toString()))
}

C2SStream.prototype.onSession = function(stanza) {
    this.send(new ltx.Element('iq', {
            type: 'result',
            id: stanza.attrs.id
        })
        .c('session', {
            xmlns: NS_SESSION
        }))
    this.emit('online')
}

module.exports = C2SStream