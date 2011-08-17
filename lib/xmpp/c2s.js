var Connection = require('./connection');
var JID = require('./jid').JID;
var ltx = require('ltx');
var sys = require('sys');
var crypto = require('crypto');
var SRV = require('./srv');

var NS_COMPONENT = 'jabber:component:accept';

/**
 * params:
 *   router : xmpp.Router (required)
 *   options : port on which to listen to C2S connections
 */
function C2S(router, options) {
    Connection.Connection.call(this);
    // And now start listening to connections on the port provided as an option.
}

/**
 * Incoming stanzas... 
 */
C2S.prototype.receive = function(stanza) {
};
