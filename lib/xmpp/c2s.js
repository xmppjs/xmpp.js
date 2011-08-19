var Connection = require('./connection');
var JID = require('./jid').JID;
var ltx = require('ltx');
var sys = require('sys');
var crypto = require('crypto');
var SRV = require('./srv');
var net = require('net');
var sasl = require('./sasl');

var NS_CLIENT = 'jabber:client';
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
var NS_XMPP_TLS  = 'urn:ietf:params:xml:ns:xmpp-tls';

/**
* params:
*   router : xmpp.Router (required)
*   options : port on which to listen to C2S connections
*/
function C2S(router, options) {
    // And now start listening to connections on the port provided as an option.
    var self = this;
    net.createServer(function(inStream) {
        self.acceptConnection(inStream, router, options);
        }).listen(options.port, options.host);
    }

    sys.inherits(C2S, Connection.Connection);
    exports.C2S = C2S;

/**
* Incoming stanzas... 
*/
C2S.prototype.receive = function(stanza) {
};

/**
* Called upon TCP connection from client.
*/
C2S.prototype.acceptConnection = function(socket, router, options) {
    var client = new C2SClient(socket, router, this);
    socket.addListener('error', function() { });
    client.addListener('error', function() { });
}

function C2SClient(socket, router, c2s) {
    var self = this;
    this.router = router;
    this.c2s = c2s;
    Connection.Connection.call(this, socket);
    
    this.xmlns[''] = NS_CLIENT;
    this.xmppVersion = '1.0';

    this.startParser();
    this.addListener('streamStart', function(streamAttrs) {
        self.startStream(streamAttrs);
    });

    this.addListener('rawStanza', function(stanza) {
        // Send up!
        
        if(stanza.is('auth', NS_XMPP_SASL)) {
            // Let's pick the right mechanism
            for(var i in this.mechanisms) {
                if(stanza.attrs.mechanism == this.mechanisms[i].name) {
                    this.mechanism =  this.mechanisms[i];
                    this.send(new ltx.Element('challenge', { xmlns: NS_XMPP_SASL }).t(this.challenge()));
                    break;
                }
                else {
                    // We're doomed. Not right auth mechanism offered.
                }
            }
        }
        else if(stanza.is('response', NS_XMPP_SASL)) {
            // We got a response.
            // Let's decode it.
            // username="julien",nonce="12132431241",cnonce="WMnhZKjLyJepmV8v+IfSVO/zpWcQVZQWJWQjWazhkUM=",nc=00000001,digest-uri="xmpp/127.0.0.1",qop=auth,response=ef4e5613f563bfff073e0796a9496a33,charset=utf-8
            this.auth(stanza.getText());
        }
        else {
            this.c2s.emit('stanza', stanza, this);
        }
    });

    return self;
};
sys.inherits(C2SClient, Connection.Connection);

C2SClient.prototype.startStream = function(streamAttrs) {
    var attrs = {};
    for(var k in this.xmlns) {
        if (this.xmlns.hasOwnProperty(k)) {
            if (!k)
                attrs.xmlns = this.xmlns[k];
            else
                attrs['xmlns:' + k] = this.xmlns[k];
        }
    }
    if (this.xmppVersion)
        attrs.version = this.xmppVersion;
    if (this.streamTo)
        attrs.to = this.streamTo;

    this.streamId = generateId();
    
    attrs.id = this.streamId;

    attrs.from = "127.0.0.1";
    
    var el = new ltx.Element('stream:stream', attrs);
    // make it non-empty to cut the closing tag
    el.t(' ');
    var s = el.toString();
    this.send(s.substr(0, s.indexOf(' </stream:stream>')));

    this.setFeatures();
} 

C2SClient.prototype.setFeatures = function() {
    this.mechanisms = sasl.availableMechanisms();

    var features = new ltx.Element('stream:features');
    var mechanisms = features.c("mechanisms", { xmlns: NS_XMPP_SASL});
    for(var i in this.mechanisms) {
        mechanisms.c("mechanism").t(this.mechanisms[i].name); // We allow DIGEST-MD5.
    }
    this.send(features);
}

C2SClient.prototype.challenge = function() {
    return encode64(this.mechanism.serverChallenge());
}

C2SClient.prototype.auth = function(response) {
    if(this.mechanism.response(decode64(response))) {
        // Now check the actual auth. The question is : how?
        this.mechanism.password = "hello";
        console.log(this.mechanism.response);
        console.log(this.mechanism.responseValue(decode64(response)));
    }
    else {
        this.send(new ltx.Element('failure', {xmlns: 'urn:ietf:params:xml:ns:xmpp-sasl'}));
    }
}


function generateId() {
    var r = new Buffer(16);
    for(var i = 0; i < r.length; i++) {
        r[i] = 48 + Math.floor(Math.random() * 10);  // '0'..'9'
    }
    return r.toString();
};

function decode64(encoded) {
    return (new Buffer(encoded, 'base64')).toString('utf8');
}
function encode64(decoded) {
    return (new Buffer(decoded, 'utf8')).toString('base64');
}


