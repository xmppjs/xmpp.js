var Connection = require('./connection');
var JID = require('./jid').JID;
var xml = require('./xml');
var sasl = require('./sasl');
var sys = require('sys');
var dns = require('dns');
var Buffer = require('buffer').Buffer;

var NS_CLIENT = 'jabber:client';
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
var NS_XMPP_BIND = 'urn:ietf:params:xml:ns:xmpp-bind';
var NS_XMPP_SESSION = 'urn:ietf:params:xml:ns:xmpp-session';

var STATE_PREAUTH = 0,
    STATE_AUTH = 1,
    STATE_AUTHED = 2,
    STATE_BIND = 3,
    STATE_SESSION = 4,
    STATE_ONLINE = 5;
var IQID_SESSION = 'sess',
    IQID_BIND = 'bind';

/**
 * params:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (optional)
 *   port: Number (optional)
 */
function Client(params) {
    Connection.Connection.call(this);

    if (typeof params.jid == 'string')
	this.jid = new JID(params.jid);
    else
	this.jid = params.jid;
    this.password = params.password;
    this.xmlns = NS_CLIENT;
    this.xmppVersion = "1.0";
    this.streamTo = this.jid.domain;
    this.state = STATE_PREAUTH;
    this.addListener('rawStanza', this.onRawStanza);

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
			       /* Epic design fail: we cannot retry
				  with another SRV result because that
				  will confuse the user with
				  non-terminal 'error' & 'end' events.
				*/
			       self.connect(addrs[0].port, addrs[0].name);
			   }
		       });
    }
}

sys.inherits(Client, Connection.Connection);
exports.Client = Client;

Client.prototype.onRawStanza = function(stanza) {
    /* Actually, we shouldn't wait for <stream:features/> if
       this.streamAttrs.version is missing, but who uses pre-XMPP-1.0
       these days anyway? */
    if (this.state != STATE_ONLINE &&
	stanza.is('features', Connection.NS_STREAM)) {
	this.streamFeatures = stanza;
	this.useFeatures();
    } else if (this.state == STATE_AUTH) {
	if (stanza.is('challenge', NS_XMPP_SASL)) {
	    var challengeMsg = decode64(stanza.getText());
	    var responseMsg = encode64(
				  this.mech.challenge(challengeMsg));
	    this.send(new xml.Element('response',
				      { xmlns: NS_XMPP_SASL
				      }).t(responseMsg));
	} else if (stanza.is('success', NS_XMPP_SASL)) {
	    this.mech = null;
	    this.state = STATE_AUTHED;
	    this.startStream();
	} else {
	    this.emit('error', 'XMPP authentication failure');
	}
    } else if (this.state == STATE_BIND &&
	       stanza.is('iq', NS_CLIENT) &&
	       stanza.attrs.id == IQID_BIND) {
	if (stanza.attrs.type == 'result') {
	    this.state = STATE_AUTHED;
	    this.did_bind = true;

	    var bindEl = stanza.getChild('bind', NS_XMPP_BIND);
	    if (bindEl && bindEl.getChild('jid')) {
		this.jid = new JID(bindEl.getChild('jid').getText());
	    }

	    /* no stream restart, but next feature */
	    this.useFeatures();
	} else {
	    this.emit('error', 'Cannot bind resource');
	}
    } else if (this.state == STATE_SESSION &&
	       stanza.is('iq', NS_CLIENT) &&
	       stanza.attrs.id == IQID_SESSION) {
	if (stanza.attrs.type == 'result') {
	    this.state = STATE_AUTHED;
	    this.did_session = true;

	    /* no stream restart, but next feature (most probably
	       we'll go online next) */
	    this.useFeatures();
	} else {
	    this.emit('error', 'Cannot bind resource');
	}
    } else if (stanza.name == 'stream:error') {
	this.emit('error', stanza);
    } else if (this.state == STATE_ONLINE) {
	this.emit('stanza', stanza);
    }
};

/**
 * Either we just received <stream:features/>, or we just enabled a
 * feature and are looking for the next.
 */
Client.prototype.useFeatures = function() {
    if (this.state == STATE_PREAUTH &&
	this.streamFeatures.getChild('mechanisms', NS_XMPP_SASL)) {
	this.state = STATE_AUTH;
	this.mech = sasl.selectMechanism(
		       this.streamFeatures.
		       getChild('mechanisms', NS_XMPP_SASL).
		       getChildren('mechanism', NS_XMPP_SASL).
		       map(function(el) { return el.getText(); }));
	if (this.mech) {
	    this.mech.authzid = this.jid.bare().toString();
	    this.mech.authcid = this.jid.user;
	    this.mech.password = this.password;
	    this.mech.realm = this.jid.domain;  // anything?
	    this.mech.digest_uri = "xmpp/" + this.jid.domain;
	    var authMsg = encode64(this.mech.auth());
	    this.send(new xml.Element('auth',
				      { xmlns: NS_XMPP_SASL,
					mechanism: this.mech.name
				      }).t(authMsg));
	} else {
	    this.emit('error', 'No usable SASL mechanism');
	}
    } else if (this.state == STATE_AUTHED &&
	       !this.did_bind &&
	       this.streamFeatures.getChild('bind', NS_XMPP_BIND)) {
	this.state = STATE_BIND;
	var bindEl = new xml.Element('iq',
				     { type: 'set',
				       id: IQID_BIND
				     }).c('bind',
					  { xmlns: NS_XMPP_BIND
					  });
	if (this.jid.resource)
	    bindEl.c('resource').t(this.jid.resource);
	this.send(bindEl);
    } else if (this.state == STATE_AUTHED &&
	       !this.did_session &&
	       this.streamFeatures.getChild('session', NS_XMPP_SESSION)) {
	this.state = STATE_SESSION;
	this.send(new xml.Element('iq',
				  { type: 'set',
				    to: this.jid.domain,
				    id: IQID_SESSION
				  }).c('session',
				       { xmlns: NS_XMPP_SESSION
				       }));
    } else if (this.state == STATE_AUTHED) {
	/* Ok, we're authenticated and all features have been
	   processed */
	this.state = STATE_ONLINE;
	this.emit('online');
    }
};

function decode64(encoded) {
    return (new Buffer(encoded, 'base64')).toString('utf8');
}
function encode64(decoded) {
    return (new Buffer(decoded, 'utf8')).toString('base64');
}
