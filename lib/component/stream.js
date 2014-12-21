'use strict';

var util = require('util')
  , crypto = require('crypto')
  , EventEmitter = require('events').EventEmitter
  , Connection = require('node-xmpp-core').Connection
  , JID = require('node-xmpp-core').JID
  , ltx = require('node-xmpp-core').ltx

function ComponentStream(opts) {
    EventEmitter.call(this)
    var self = this
    this.connection = opts.connection || new Connection()
    this._addConnectionListeners()
    this.connection.xmlns[''] = this.NS_COMPONENT
    this.connection.xmlns.stream = this.NS_STREAM
    // if the server shuts down, we close all connections
    if (this.server) {
        var serverClosed
        this.server.once('shutdown', serverClosed = function () {
            if (self.connection)
                self.connection.end()
        })
        this.on('close', function () {
            this.server.removeListener('shutdown', serverClosed)
        })
    }
    if (this.connection.connect)
        this.connection.connect({socket:opts.socket})
    return this
}

util.inherits(ComponentStream, EventEmitter)

ComponentStream.prototype.NS_COMPONENT = 'jabber:component:accept'
ComponentStream.prototype.NS_STREAM = 'http://etherx.jabber.org/streams'

ComponentStream.prototype.onStreamStart = function(streamAttrs) {
    var self = this
    this.jid = new JID(streamAttrs.to)
    this.emit('verify-component', this.jid, function(err, password){
	if(err) { 
            self.connection.send(new ltx.Element('host-unknown'))
	    self.connection.end();
        } else {
            if(!streamAttrs.id) streamAttrs.id = Date.now()
            self.expectedDigest = self._sha1Hex((streamAttrs.id || '') + password)
            self.connection.streamAttrs=streamAttrs
       	    self.connection.startStream()
        }
    });
}

ComponentStream.prototype.onStanza = function(stanza) {
    if (stanza.is('handshake')) {
	if(stanza.getText() === this.expectedDigest)	{
         this.emit('auth-success')
         this.connection.send(new ltx.Element('handshake'))
         this.emit('online')
         this.authenticated = true
      } else {
	// Per XEP-0114 DO NOT return any errors, just close the connection
 	 this.end()
      }
    }
    else this.emit('stanza', stanza)
}

ComponentStream.prototype.send = function(stanza) {
    this.connection.send(stanza)
}

ComponentStream.prototype.end = function() {
    this.connection.end()
}

ComponentStream.prototype._addConnectionListeners = function (con) {
    con = con || this.connection
    con.on('streamStart', this.onStreamStart.bind(this))
    con.on('stanza', this.onStanza.bind(this))
    con.on('drain', this.emit.bind(this, 'drain'))
    con.on('data', this.emit.bind(this, 'data'))
    con.on('end', this.emit.bind(this, 'end'))
    con.on('close', this.emit.bind(this, 'close'))
    con.on('error', this.emit.bind(this, 'error'))
    con.on('connect', this.emit.bind(this, 'connect'))
    con.on('reconnect', this.emit.bind(this, 'reconnect'))
    con.on('disconnect', this.emit.bind(this, 'disconnect'))
    con.on('disconnect', this.emit.bind(this, 'offline'))
}

ComponentStream.prototype._sha1Hex = function(s) {
    var hash = crypto.createHash('sha1')
    hash.update(s)
    return hash.digest('hex')
}

ComponentStream.ComponentStream = ComponentStream
module.exports = ComponentStream
