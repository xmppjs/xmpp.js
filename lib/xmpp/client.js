var Connection = require('./connection').Connection;
var JID = require('./jid').JID;
var sys = require('sys');
var dns = require('dns');

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

    if (params.host) {
	this.connect(params.port || 5222, params.host);
    } else {
	var self = this;
	dns.resolveSrv('_xmpp-client._tcp.' + this.jid.domain,
		       function(err, addrs) {
			   if (err) {
			       /* no SRV record, try domain as A */
			       self.connect(params.port || 5222, self.jid.domain);
			   } else {
			       addrs = addrs.sort(
					   function(a, b) {
					       if (a.priority < b.priority)
						   return -1;
					       else if (a.priority > b.priority)
						   return 1;
					       else
						   return 0;
					   });
			       /* Design fail: */
			       self.connect(addrs[0].port, addrs[0].name);
			   }
		       });
    }
}

sys.inherits(Client, Connection);
exports.Client = Client;
