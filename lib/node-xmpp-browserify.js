var Connection = require('./xmpp/connection');
var Client = require('./xmpp/client').Client;
var JID = require('./xmpp/jid');
var ltx = require('ltx');
var Stanza = require('./xmpp/stanza');

exports.Connection = Connection;
exports.Client = Client;
exports.JID = JID;
exports.Element = ltx.Element;
exports.Stanza = Stanza.Stanza;
exports.Message = Stanza.Message;
exports.Presence = Stanza.Presence;
exports.Iq = Stanza.Iq;

window.XMPP = exports;
