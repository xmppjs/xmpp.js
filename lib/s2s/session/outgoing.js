'use strict';

var util = require('util'),
    SRV = require('node-xmpp-core').SRV,
    Connection = require('node-xmpp-core').Connection,
    Server = require('./server'),
    debug = require('debug')('outserver')

var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl'

var OutgoingServer = function(srcDomain, destDomain, credentials) {
    debug('OutgoingServer ' + srcDomain + ' ' + destDomain + ' ' + credentials)
    var self = this;

    this.streamId = null;

    var streamAttrs = {};
    streamAttrs.version = '1.0'

    Server.call(this, {streamAttrs: streamAttrs});

    this.streamTo = destDomain

    // For outgoing, we only need our own cert & key
    this.credentials = credentials

    // No credentials means we cannot <starttls/> on the server
    // side. Unfortunately this is required for XMPP 1.0.
    if (!this.credentials) delete this.xmppVersion

    this.on('connect', function() {
        debug('SOCKET connected')
        //self.startParser()
        self.startStream()
    });

    this.on('streamStart', function(attrs) {
        debug('streamStart and emit event' + JSON.stringify(attrs))
        if (attrs.version !== '1.0') {
            // Don't wait for <stream:features/>
            self.emit('auth', 'dialback')
        }

        // extract stream id
        this.streamId = attrs.id;
    })

    this.on('stanza', function(stanza) {
        debug('stanza' + stanza)
        if (stanza.is('features', Connection.NS_STREAM)) {
            debug('features')
            var mechsEl
            if ((mechsEl = stanza.getChild('mechanisms', NS_XMPP_SASL))) {
                var mechs = mechsEl
                    .getChildren('mechanism', NS_XMPP_SASL)
                    .map(function(el) { return el.getText() })

                if (mechs.indexOf('EXTERNAL') >= 0) {
                    self.emit('auth', 'external')
                } else {
                    self.emit('auth', 'dialback')
                }
            } else {
                // No SASL mechanisms
                self.emit('auth', 'dialback')
            }
        }

        self.handleDialback(stanza);
    })

    // establish connection
    var socket = SRV.connect({
        connection:  this,
        services:    ['_xmpp-server._tcp', '_jabber._tcp'],
        domain:      destDomain,
        defaultPort: 5269
    });

    this.listen({'socket': socket})

}

util.inherits(OutgoingServer, Server)

module.exports = OutgoingServer;