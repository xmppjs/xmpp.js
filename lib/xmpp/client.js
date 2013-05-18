var EventEmitter = require('events').EventEmitter;
var Session = require('./session').Session;
var Connection = require('./connection');
var JID = require('./jid').JID;
var ltx = require('ltx');
var sasl = require('./sasl');
var util = require('util');
try {
    var SRV = require('./srv');
} catch (e) { }

var NS_CLIENT = 'jabber:client';
var NS_REGISTER = 'jabber:iq:register';
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
 * params object:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (optional)
 *   port: Number (optional)
 *   reconnect: Boolean (optional)
 *   register: Boolean (option) - register account before authentication
 *   legacySSL: Boolean (optional) - connect to the legacy SSL port, requires at least the host to be specified
 *   credentials: Dictionary (optional) - TLS or SSL key and certificate credentials
 *   actAs: String (optional) - if admin user act on behalf of another user (just user)
 *
 * Examples:
 *   var cl = new xmpp.Client({
 *       jid: "me@example.com",
 *       password: "secret"
 *   });
 *   var aceboo = new xmpp.Client({
 *       jid: '-' + fbUID + '@chat.facebook.com',
 *       api_key: '54321', // api key of your facebook app
 *       access_token: 'abcdefg', // user access token
 *       host: 'chat.facebook.com'
 *   });
 *   var gtalk = new xmpp.Client({
 *       jid: 'me@gmail.com',
 *       oauth2_token: 'xxxx.xxxxxxxxxxx', // from OAuth2
 *       oauth2_auth: 'http://www.google.com/talk/protocol/auth',
 *       host: 'talk.google.com'
 *   });
 *
 * Example SASL EXTERNAL:
 * 
 * var myCredentials = { 
 *   // These are necessary only if using the client certificate authentication
 *   key: fs.readFileSync('key.pem'),
 *   cert: fs.readFileSync('cert.pem'),
 *   // passphrase: 'optional'
 * };
 * var cl = new xmppClient({jid: "me@example.com", credentials: myCredentials }); 
 
 */
function Client(opts) {
    var self = this;

    opts.xmlns = NS_CLIENT;
    self.state = STATE_PREAUTH;
    delete self.did_bind;
    delete self.did_session;

    Session.call(this, opts);

    if (opts.credentials) {
        this.preferredSaslMechanism = 'EXTERNAL';
        this.availableSaslMechanisms = [ sasl.External ];
    }

    this.state = STATE_PREAUTH;
    this.addListener('end', function() {
        self.state = STATE_PREAUTH;
        self.emit('offline');
    });
    this.on('close', function() {
        self.state = STATE_PREAUTH;
    });
}

util.inherits(Client, Session);
exports.Client = Client;

Client.prototype.onStanza = function(stanza) {
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
            var responseMsg = encode64(this.mech.challenge(challengeMsg));
            this.send(new ltx.Element('response',
                                      { xmlns: NS_XMPP_SASL
                                      }).t(responseMsg));
        } else if (stanza.is('success', NS_XMPP_SASL)) {
            this.mech = null;
            this.state = STATE_AUTHED;
	    if (this.connection.startParser)
		this.connection.startParser();
	    if (this.connection.startStream)
		this.connection.startStream();
        } else {
            this.emit('error', 'XMPP authentication failure');
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
        this.register) {
	delete this.register;
	this.doRegister();
    } else if (this.state == STATE_PREAUTH &&
        this.streamFeatures.getChild('mechanisms', NS_XMPP_SASL)) {
        this.state = STATE_AUTH;
	var offeredMechs = this.streamFeatures.
            getChild('mechanisms', NS_XMPP_SASL).
            getChildren('mechanism', NS_XMPP_SASL).
            map(function(el) { return el.getText(); });
        this.mech = sasl.selectMechanism(
            offeredMechs,
            this.preferredSaslMechanism,
            this.availableSaslMechanisms);
        if (this.mech) {
            this.mech.authzid = this.jid.bare().toString();
            this.mech.authcid = this.jid.user;
            this.mech.password = this.password;
            this.mech.api_key = this.api_key;
            this.mech.access_token = this.access_token;
            this.mech.oauth2_token = this.oauth2_token;
            this.mech.oauth2_auth = this.oauth2_auth;
            this.mech.realm = this.jid.domain;  // anything?
            if (this.actAs) this.mech.actAs = this.actAs.user;
            this.mech.digest_uri = "xmpp/" + this.jid.domain;
            var authMsg = encode64(this.mech.auth());
            var attrs = this.mech.authAttrs();
            attrs.xmlns = NS_XMPP_SASL;
            attrs.mechanism = this.mech.name;
            this.send(new ltx.Element('auth', attrs).
		      t(authMsg));
        } else {
            this.emit('error', 'No usable SASL mechanism');
        }
    } else if (this.state == STATE_AUTHED &&
               !this.did_bind &&
               this.streamFeatures.getChild('bind', NS_XMPP_BIND)) {
        this.state = STATE_BIND;
        var bindEl = new ltx.Element('iq',
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
        this.send(new ltx.Element('iq',
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

Client.prototype.doRegister = function() {
    var id = "register" + Math.ceil(Math.random() * 99999);
    var iq = new ltx.Element('iq', { type: 'set',
				     id: id,
				     to: this.jid.domain
				   }).
	c('query', { xmlns: NS_REGISTER }).
	c('username').t(this.jid.user).up().
	c('password').t(this.password);
    this.send(iq);

    var that = this;
    var onReply = function(reply) {
	if (reply.is('iq') && reply.attrs.id === id) {
	    that.removeListener('stanza', onReply);

	    if (reply.attrs.type === 'result') {
		/* Registration successful, proceed to auth */
		that.useFeatures();
	    } else {
		that.emit('error', new Error("Registration error"));
	    }
	}
    };
    this.on('stanza', onReply);
};

Client.prototype.registerSaslMechanism = function () {
    var args = arguments.length > 0 ? Array.prototype.slice.call(arguments) : [];
    this.availableSaslMechanisms = this.availableSaslMechanisms.concat(args);
};

var decode64, encode64, Buffer;
if (typeof btoa === 'function') {
    decode64 = function(encoded) {
	return atob(encoded);
    };
} else {
    Buffer = require('buffer').Buffer;
    decode64 = function(encoded) {
	return (new Buffer(encoded, 'base64')).toString('utf8');
    };
}
if (typeof atob === 'function') {
    encode64 = function(decoded) {
	return btoa(decoded);
    };
} else {
    Buffer = require('buffer').Buffer;
    encode64 = function(decoded) {
	return (new Buffer(decoded, 'utf8')).toString('base64');
    };
}
