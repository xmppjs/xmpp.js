var crypto = require('crypto');
var querystring = require('querystring');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function selectMechanism(mechs) {
    if (mechs.indexOf("X-FACEBOOK-PLATFORM") >= 0)
        return new XFacebookPlatform();
    // else if (mechs.indexOf("DIGEST-MD5") >= 0)
    //     return new DigestMD5();
    else if (mechs.indexOf("PLAIN") >= 0)
        return new Plain();
    else if (mechs.indexOf("ANONYMOUS") >= 0)
        return new Anonymous();
    else
        return null;
}

exports.selectMechanism = selectMechanism;

function availableMechanisms() {
    return [new Plain()];
}
exports.availableMechanisms = availableMechanisms;

// Mechanisms
function Mechanism() {
    EventEmitter.call(this);
}
util.inherits(Mechanism, EventEmitter);

function Plain() {
    this.name = "PLAIN";
    this.auth = function() {
        return this.authzid + "\0" +
            this.authcid + "\0" +
            this.password;
    };

    this.authServer = function(auth, client) {
        var params = auth.split("\x00");
        this.username = params[1];
        client.authenticate(this.username, params[2]);
    };
}
util.inherits(Plain, Mechanism);

function XFacebookPlatform() {
    this.name = "X-FACEBOOK-PLATFORM";
    this.auth = function() {
        return "";
    };
    this.challenge = function(s) {
        var dict = querystring.parse(s);

        var response = {
            api_key: this.api_key,
            call_id: new Date().getTime(),
            method: dict.method,
            nonce: dict.nonce,
            access_token: this.access_token,
            v: "1.0"
        };

        return querystring.stringify(response);
    };
}
util.inherits(XFacebookPlatform, Mechanism);

function Anonymous() {
    this.name = "ANONYMOUS";
    this.auth = function() {
        return this.authzid;
    };
}
util.inherits(Anonymous, Mechanism);

function DigestMD5() {
    this.name = "DIGEST-MD5";
    this.auth = function() {
        return "";
    };

    this.nonce_count = 0;
    this.getNC = function() {
        return rjust(this.nonce_count.toString(), 8, '0');
    };
    this.cnonce = generateNonce();

    this.responseValue = function(s) {
        var dict = parseDict(s);
        if (dict.realm)
            this.realm = dict.realm;

        var value;
        if (dict.nonce && dict.qop) {
            this.nonce_count++;
            var a1 = md5(this.authcid + ':' +
                            this.realm + ':' +
                            this.password) + ':' +
                            dict.nonce + ':' +
                            this.cnonce + ':' +
                            this.authzid || "";
            var a2 = "AUTHENTICATE:" + this.digest_uri;
            if (dict.qop == 'auth-int' || dict.qop == 'auth-conf')
                a2 += ":00000000000000000000000000000000";

            value = md5_hex(md5_hex(a1) + ':' +
                            dict.nonce + ':' +
                            this.getNC() + ':' +
                            this.cnonce + ':' +
                            dict.qop + ':' +
                            md5_hex(a2));
        }
        return value;
    };

    this.challenge = function(s) {
        var dict = parseDict(s);
        if (dict.realm)
            this.realm = dict.realm;

        var response;
        if (dict.nonce && dict.qop) {
            var responseValue = this.responseValue(s);
            response = {
                username: this.authcid,
                realm: this.realm,
                nonce: dict.nonce,
                cnonce: this.cnonce,
                nc: this.getNC(),
                qop: dict.qop,
                'digest-uri': this.digest_uri,
                response: responseValue,
                authzid: this.authzid || "",
                charset: 'utf-8'
            };
        } else if (dict.rspauth) {
            return "";
        }
        return encodeDict(response);
    };

    this.serverChallenge = function() {
        var dict = {};
        dict.realm = "";
        this.nonce = dict.nonce = generateNonce();
        dict.qop = "auth";
        this.charset = dict.charset = "utf-8";
        dict.algorithm = "md5-sess";
        return encodeDict(dict);
    };

    // Used on the server to check for auth!
    this.response = function(s) {
        var dict = parseDict(s);
        this.authcid = dict.username;
        if(dict.nonce != this.nonce) {
            return false;
        }
        if(!dict.cnonce) {
            return false;
        }
        this.cnonce = dict.cnonce;
        if(this.charset != dict.charset) {
            return false;
        }
        this.response = dict.response;
        return true;
    };
}
util.inherits(DigestMD5, Mechanism);

/**
 * Parse SASL serialization
 */
function parseDict(s) {
    var result = {};
    while (s) {
        var m;
        if((m = /^(.+?)=(.*?[^\\]),(.*)/.exec(s))) {
            result[m[1]] = m[2].replace(/\"/g, '');
            s = m[3];
        } else if ((m = /^(.+?)=(.+?),(.*)/.exec(s))) {
            result[m[1]] = m[2];
            s = m[3];
        } else if ((m = /^(.+?)="(.*?[^\\])"$/.exec(s))) {
            result[m[1]] = m[2];
            s = m[3];
        } else if ((m = /^(.+?)=(.+?)$/.exec(s))) {
            result[m[1]] = m[2];
            s = m[3];
        } else {
            s = null;
        }
    }
    return result;
}

/**
 * SASL serialization
 */
function encodeDict(dict) {
    var s = "";
    for(k in dict) {
        var v = dict[k];
        if (v)
            s += ',' + k + '="' + v + '"';
    }
    return s.substr(1);  // without first ','
}

/**
 * Right-justify a string,
 * eg. pad with 0s
 */
function rjust(s, targetLen, padding) {
    while(s.length < targetLen)
        s = padding + s;
    return s;
}

/**
 * Hash a string
 */
function md5(s, encoding) {
    var hash = crypto.createHash('md5');
    hash.update(s);
    return hash.digest(encoding || 'binary');
}

/**
 * Hash a string hexadecimally
 */
function md5_hex(s) {
    return md5(s, 'hex');
}

/**
 * Generate a string of 8 digits
 * (number used once)
 */
function generateNonce() {
    var result = "";
    for(var i = 0; i < 8; i++)
        result += String.fromCharCode(48 +
                                      Math.ceil(Math.random() * 10));
    return result;
}
