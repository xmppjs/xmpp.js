var Client = require('./xmpp/client').Client;
var JID = require('./xmpp/jid').JID;
var XML = require('./xmpp/xml');

exports.Client = Client;
exports.JID = JID;
exports.XML = XML;
exports.Element = XML.Element;
