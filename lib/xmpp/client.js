var Connection = require('./connection').Connection;
var JID = require('./jid').JID;
var sys = require('sys');
var puts = require('sys').puts;

/**
 * params:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (optional)
 *   port: Number (optional)
 */
function Client(params) {
    Connection.call(this);

    this.jid = new JID(params.jid);
    this.password = params.password;
    this.xmlns = "jabber:client";
    this.xmppVersion = "1.0";
    this.streamTo = this.jid.domain;

    this.connect(params.port, params.host);
}

sys.inherits(Client, Connection);
exports.Client = Client;
