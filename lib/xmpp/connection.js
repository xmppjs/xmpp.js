var net = require('net');
var sys = require('sys');
var expat = require('expat');
var xml = require('./xml');
var sasl = require('./sasl');
var JID = require('./jid').JID;
var b64 = require('base64');

var NS_XMPP_TLS = 'urn:ietf:params:xml:ns:xmpp-tls';
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
var NS_XMPP_BIND = 'urn:ietf:params:xml:ns:xmpp-bind';
var NS_XMPP_SESSION = 'urn:ietf:params:xml:ns:xmpp-session';

var STATE_PREAUTH = 0,
    STATE_TLS = 1,
    STATE_AUTH = 2,
    STATE_AUTHED = 3,
    STATE_BIND = 4,
    STATE_SESSION = 5,
    STATE_ONLINE = 6;
var IQID_SESSION = 'sess',
    IQID_BIND = 'bind';

function Connection() {
    net.Stream.call(this);

    this.state = STATE_PREAUTH;
    this.charset = 'UTF-8';
    this.allowTLS = true;  /* can be set by user */
    this.addListener('connect', this.startStream);
    this.addListener('data', this.onData);
//    this.addListener('end', this.onEnd);
//    this.addListener('error', this.onError);
}

sys.inherits(Connection, net.Stream);
exports.Connection = Connection;

Connection.prototype.send = function(stanza) {
    var self = this;
    if (stanza.root)
	stanza.root().write(function(s) {
	    self.write(s);
	});
    else
	self.write(stanza);
};

Connection.prototype.startParser = function() {
    var self = this;
    self.element = null;
    self.parser = new expat.Parser(self.charset);

    self.parser.addListener('startElement', function(name, attrs) {
	if (!self.element && name == 'stream:stream') {
	    self.streamAttrs = attrs;
	} else {
	    var child = new xml.Element(name, attrs);
	    if (!self.element) {
		/* TODO: add stream xmlns */
		self.element = child;
	    } else {
		self.element = self.element.cnode(child);
	    }
	}
    });
    self.parser.addListener('endElement', function(name, attrs) {
	if (!self.element && name == 'stream:stream') {
	    self.end();
	} else if (self.element && name == self.element.name) {
	    if (self.element.parent)
		self.element = self.element.parent;
	    else {
		/* Stanza complete */
		self.onStanza(self.element);
		self.element = null;
	    }
	} else {
	    self.emit('parseError');
	    self.end();
	}
    });
    self.parser.addListener('text', function(str) {
	if (self.element)
	    self.element.t(str);
    });
};

Connection.prototype.startStream = function() {
    this.startParser();

    var tag = "<stream:stream xmlns='" + this.xmlns +
	"' xmlns:stream='http://etherx.jabber.org/streams'" +
	" to='" + this.streamTo + "'";
    if (this.xmppVersion)
	tag += " version='" + this.xmppVersion + "'";
    tag += ">";
    this.send(tag);
};

Connection.prototype.onData = function(data) {
    if (this.parser) {
	if (!this.parser.parse(data.toString(), false)) {
	    this.emit('parseError');
	    this.end();
	}
    }
};

/**
 * This is not an event listener, but takes care of the authentication
 * before 'stanza' events are emitted to the user.
 */
Connection.prototype.onStanza = function(stanza) {
    if (this.state == STATE_ONLINE) {
	this.emit('stanza', this.element);
    } else if (stanza.name == 'stream:features') {
	this.streamFeatures = stanza;
	this.useFeatures();
    } else if (this.state == STATE_TLS) {
	if (stanza.is('proceed', NS_XMPP_TLS)) {
	    this.setSecure();
	    this.addListener('secure',
			     function() {
				 this.state = STATE_PREAUTH;
				 this.startStream();
			     });
	} else {
	    this.emit('error', 'Cannot begin TLS handshake');
	    this.end();
	}
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
 * Either onStanza just received <stream:features/>, or we just
 * enabled a feature and are looking for the next.
 */
Connection.prototype.useFeatures = function() {
    if (this.allowTLS &&
	this.state == STATE_PREAUTH &&
	this.streamFeatures.getChild('starttls', NS_XMPP_TLS)) {
	this.state = STATE_TLS;
	this.send(new xml.Element('starttls', { xmlns: NS_XMPP_TLS }));
    } else if (this.state == STATE_PREAUTH &&
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
