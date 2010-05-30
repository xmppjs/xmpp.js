var Connection = require('./connection').Connection;
var JID = require('./jid').JID;
var xml = require('./xml');
var sasl = require('./sasl');
var sys = require('sys');
var dns = require('dns');
var b64 = require('base64');

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
    Connection.call(this);

    if (typeof params.jid == 'string')
	this.jid = new JID(params.jid);
    else
	this.jid = params.jid;
    this.password = params.password;
    this.xmlns = "jabber:client";
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

sys.inherits(Client, Connection);
exports.Client = Client;

Client.prototype.onRawStanza = function(stanza) {
    /* Actually, we shouldn't wait for <stream:features/> if
       this.streamAttrs.version is missing, but who uses pre-XMPP-1.0
       these days anyway? */
    if (this.state != STATE_ONLINE &&
	stanza.name == 'stream:features') {
	this.streamFeatures = stanza;
	this.useFeatures();
    } else if (this.state == STATE_AUTH) {
	if (stanza.is('success', NS_XMPP_SASL)) {
	    this.state = STATE_AUTHED;
	    this.startStream();
	} else {
	    this.emit('authFail');
	    this.end();
	}
    } else if (this.state == STATE_BIND &&
	       stanza.is('iq') &&
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
	    this.end();
	}
    } else if (this.state == STATE_SESSION &&
	       stanza.is('iq') &&
	       stanza.attrs.id == IQID_SESSION) {
	if (stanza.attrs.type == 'result') {
	    this.state = STATE_AUTHED;
	    this.did_session = true;

	    /* no stream restart, but next feature (most probably
	       we'll go online next) */
	    this.useFeatures();
	} else {
	    this.emit('error', 'Cannot bind resource');
	    this.end();
	}
    } else if (stanza.name == 'stream:error') {
	this.emit('error', stanza);
	this.end();
    }
};

/**
 * Either we just received <stream:features/>, or we just enabled a
 * feature and are looking for the next.
 */
Connection.prototype.useFeatures = function() {
    if (this.state == STATE_PREAUTH &&
	       this.streamFeatures.getChild('mechanisms', NS_XMPP_SASL)) {
	this.state = STATE_AUTH;
	var mech = selectAuthMechanism(this.streamFeatures.
				       getChild('mechanisms', NS_XMPP_SASL).
				       getChildren('mechanism', NS_XMPP_SASL).
				       map(function(el) { return el.getText(); }));
	if (mech) {
	    mech.authzid = this.jid.bare().toString();
	    mech.authcid = this.jid.user;
	    mech.password = this.password;
	    this.send(new xml.Element('auth',
				      { xmlns: NS_XMPP_SASL,
					mechanism: mech.name
				      }).t(b64.encode(mech.auth())));
	} else {
	    this.emit('authFail');
	    this.end();
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

function selectAuthMechanism(mechs) {
    /*if (mechs.indexOf("DIGEST-MD5") >= 0)
	return "DIGEST-MD5";
    else*/ if (mechs.indexOf("PLAIN") >= 0)
	return new sasl.Mechanism("PLAIN");
    else
	return null;
}
