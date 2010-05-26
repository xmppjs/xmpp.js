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
    STATE_AUTH = 1,
    STATE_AUTHED = 2,
    STATE_BIND = 3,
    STATE_SESSION = 4,
    STATE_ONLINE = 5;
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
    } else if (this.state == STATE_PREAUTH &&
	       stanza.name == 'stream:features') {
	if (this.allowTLS &&
	    stanza.getChild('starttls', NS_XMPP_TLS)) {
	    this.send(new xml.Element('starttls', { xmlns: NS_XMPP_TLS }));
	} else if (stanza.getChild('mechanisms', NS_XMPP_SASL)) {
	    this.state = STATE_AUTH;
	    var mechs = stanza.getChild('mechanisms', NS_XMPP_SASL).
			    getChildren('mechanism', NS_XMPP_SASL).
			    map(function(el) { return el.getText(); });
	    var mech = selectAuthMechanism(mechs);
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
	}
    } else if (stanza.name == 'proceed' &&
	       stanza.getNS() == NS_XMPP_TLS) {
	this.setSecure();
	this.addListener('secure', this.startStream);
    } else if (this.state == STATE_AUTH &&
	       stanza.getNS() == NS_XMPP_SASL) {
	if (stanza.name == 'success') {
	    this.state = STATE_AUTHED;
	    this.startStream();
	} else {
	    this.emit('authFail');
	    this.end();
	}
    } else if (this.state == STATE_AUTHED &&
	       stanza.name == 'stream:features' &&
	       stanza.getChild('bind', NS_XMPP_BIND)) {
	this.state = STATE_BIND;
	var bindEl = new xml.Element('iq',
				     { type: 'set',
				       id: IQID_BIND
				     }).c('bind',
					  { xmlns: NS_XMPP_BIND
					  });
	if (this.jid.resource)
	    bindEl.c('resource').t(this.jid.resource);
	this.send(bindEl.root());
    } else if (this.state == STATE_BIND &&
	       stanza.name == 'iq' &&
	       stanza.attrs.id == IQID_BIND) {
	if (stanza.attrs.type == 'result') {
	    this.state = STATE_AUTHED;
	    var bindEl = stanza.getChild('bind', NS_XMPP_BIND);
	    if (bindEl && bindEl.getChild('jid')) {
		this.jid = new JID(bindEl.getChild('jid').getText());
	    }

	    // FIXME: move this to check stream:features again
	    this.state = STATE_SESSION;
	    this.send(new xml.Element('iq',
				      { type: 'set',
					to: this.jid.domain,
					id: IQID_SESSION
				      }).c('session',
					   { xmlns: NS_XMPP_SESSION
					   }));
	} else {
	    this.emit('error', "Cannot bind resource");
	    this.end();
	}
    } else if (this.state == STATE_SESSION &&
	       stanza.name == 'iq' &&
	       stanza.attrs.id == IQID_SESSION) {
	if (stanza.attrs.type == 'result') {
	    this.state = STATE_ONLINE;
	    this.emit('online');
	} else {
	    this.emit('error', "Cannot establish session");
	    this.end();
	}
    } else if (stanza.name == 'stream:error') {
	this.emit('error', stanza);
	this.end();
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
