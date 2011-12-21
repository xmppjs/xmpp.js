var crypto = require('crypto');
var querystring = require('querystring');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
 * What's available for client-side authentication (Client)
 * 
 * @param {Array} mechs Server-offered SASL mechanism names
 */
function selectMechanism(mechs) {
    if (mechs.indexOf("X-FACEBOOK-PLATFORM") >= 0)
        return new XFacebookPlatform();
    else if (mechs.indexOf("SCRAM-SHA-1") >= 0)
        return new ScramSHA1();
    else if (mechs.indexOf("DIGEST-MD5") >= 0)
         return new DigestMD5();
    else if (mechs.indexOf("PLAIN") >= 0)
        return new Plain();
    else if (mechs.indexOf("ANONYMOUS") >= 0)
        return new Anonymous();
    else
        return null;
}

exports.selectMechanism = selectMechanism;

/**
 * What's available for server-side authentication (C2S)
 */
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
}
util.inherits(Plain, Mechanism);
Plain.prototype.name = "PLAIN";
Plain.prototype.auth = function() {
    return this.authzid + "\0" +
        this.authcid + "\0" +
        this.password;
};
Plain.prototype.authServer = function(auth, client) {
    var params = auth.split("\x00");
    this.username = params[1];
    client.authenticate(this.username, params[2]);
};

function XFacebookPlatform() {
}
util.inherits(XFacebookPlatform, Mechanism);
XFacebookPlatform.prototype.name = "X-FACEBOOK-PLATFORM";
XFacebookPlatform.prototype.auth = function() {
    return "";
};
XFacebookPlatform.prototype.challenge = function(s) {
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

function Anonymous() {
}
util.inherits(Anonymous, Mechanism);
Anonymous.prototype.name = "ANONYMOUS";
Anonymous.prototype.auth = function() {
    return this.authzid;
};

function DigestMD5() {
    this.nonce_count = 0;
    this.cnonce = generateNonce();
}
util.inherits(DigestMD5, Mechanism);
DigestMD5.prototype.name = "DIGEST-MD5";
DigestMD5.prototype.auth = function() {
    return "";
};
DigestMD5.prototype.getNC = function() {
    return rjust(this.nonce_count.toString(), 8, '0');
};
DigestMD5.prototype.responseValue = function(s) {
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
DigestMD5.prototype.challenge = function(s) {
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
DigestMD5.prototype.serverChallenge = function() {
    var dict = {};
    dict.realm = "";
    this.nonce = dict.nonce = generateNonce();
    dict.qop = "auth";
    this.charset = dict.charset = "utf-8";
    dict.algorithm = "md5-sess";
    return encodeDict(dict);
};

// Used on the server to check for auth!
DigestMD5.prototype.response = function(s) {
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

function Scram() {
}
util.inherits(Scram, Mechanism);
Scram.prototype.auth = function() {
    this.clientFirstMessageBare =
        "n=" + this.authcid +
        ",r=" + generateRandom();
    return "n,," + this.clientFirstMessageBare;
};
Scram.prototype.challenge = function(s) {
    this.serverFirstMessage = s;
    var dict = parseDict(s);
    var random = dict.r;
    var salt = dict.s;
    var iterations = dict.i;

    var saltedPassword = this.hi(this.password, salt, iterations);
    console.log("saltedPassword", saltedPassword);
    var clientKey = this.hmac(saltedPassword, "Client Key");
    console.log("clientKey", clientKey);
    var storedKey = this.h(clientKey);
    console.log("storedKey", storedKey);
    var clientFinalMessageWithoutProof =
        "c=" + encode64("n,,") +
        ",r=" + random;
    var authMessage = this.clientFirstMessageBare + "," +
        this.serverFirstMessage + "," +
        clientFinalMessageWithoutProof;
    var clientSignature = this.hmac(storedKey, authMessage);
    var clientProof = xor(clientKey, clientSignature);

    return clientFinalMessageWithoutProof +
        ",p=" + encode64(clientProof);
};
Scram.prototype.hi = function(str, salt, iterations) {
    var u = this.hmac(str, concatBuffers(salt, this.int(1)));
    var result = u;
    for(var i = 1; i < iterations; i++) {
        u = this.hmac(str, u);
        result = xor(result, u);
    }
    return result;
};
Scram.prototype.int = function(i) {
    var result = new Buffer(4);
    result.writeUInt32BE(i, 0);
    return result;
};

/**
 * http://tools.ietf.org/html/rfc5802
 */
function ScramSHA1() {
}
util.inherits(ScramSHA1, Scram);
ScramSHA1.prototype.name = "SCRAM-SHA-1";
ScramSHA1.prototype.h = function(s) {
    var hash = crypto.createHash('sha1');
    hash.update(s);
    return new Buffer(hash.digest('binary'), 'binary');
};
ScramSHA1.prototype.hmac = function(k, s) {
    var hmac = crypto.createHmac('sha1', k);
    hmac.update(s);
    return new Buffer(hmac.digest('binary'), 'binary');
};

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
            /* Nothing matches, done */
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
        var v = dict[k].toString();
        if (v) {
            s += ',' + k + '=';
            s += (v.indexOf(',') < 0) ?
                v :
                '"' + v + '"';
        }
    }
    return s.substr(1);  // without first ',' (FIXME)
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
 * Hash a string with hexadecimal result
 */
function md5_hex(s) {
    return md5(s, 'hex');
}

function encode64(decoded) {
    return (new Buffer(decoded, 'utf8')).toString('base64');
}

function xor(buf1, buf2) {
    if (buf1.constructor !== Buffer)
        buf1 = new Buffer(buf1, 'binary');
    if (buf2.constructor !== Buffer)
        buf2 = new Buffer(buf2, 'binary');

    var len = Math.max(buf1.length, buf2.length);
    var result = new Buffer(len);
    for(var i = 0; i < len; i++) {
        var a = (i < buf1.length) ? buf1[i] : 0;
        var b = (i < buf2.length) ? buf2[i] : 0;
        result[i] = a ^ b;
    }
    return result;
}

/**
 * Feel the pain of JavaScript strings
 */
function concatBuffers() {
    var size = 0, i, bufs = [];
    for(i = 0; i < arguments.length; i++) {
        var arg = arguments[i], buf;
        if (arg.constructor === Buffer)
            buf = arg;
        else
            buf = new Buffer(arg);
        bufs.push(buf);
        size += buf.length;
    }
    var result = new Buffer(size), offset = 0;
    for(i = 0; i < bufs.length; i++) {
        bufs[i].copy(result, offset);
        offset += bufs[i].length;
    }
    return result;
}

/**
 * Generate a string of 8 digits
 * (number used once)
 */
function generateNonce() {
    var result = "";
    for(var i = 0; i < 8; i++)
        result += String.fromCharCode(48 +
                                      Math.floor(Math.random() * 10));
    return result;
}

/**
 * Generate a sequence of random printable ASCII characters
 */
function generateRandom() {
    var result = "";
    for(var i = 0; i < 24; i++) {
        var n = Math.floor(Math.random() * (10 + 26 + 26));
        var c;
        if (n < 10)
            c = 48 + n;
        else if (n < 10 + 26)
            c = 65 + n - 10;
        else
            c = 97 + n - 10 - 26;
        result += String.fromCharCode(c);
    }
    return result;
    
}
