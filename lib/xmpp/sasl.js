var crypto = require('crypto');
var querystring = require('querystring');

function selectMechanism(mechs) {
    if (mechs.indexOf("X-FACEBOOK-PLATFORM") >= 0)
        return new XFacebookPlatform();
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

function Plain() {
    this.name = "PLAIN";
    this.auth = function() {
        return this.authzid + "\0" +
            this.authcid + "\0" +
            this.password;
    };
}

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
            session_key: this.session_key,
            v: "1.0"
        };

        var message = '';
        ['api_key', 'call_id', 'method', 'nonce', 'session_key', 'v'].forEach(function(v) {
            message += v + "=" + response[v];
        });
        
        response.sig = md5(message + this.secret_key, 'hex');
                
        return querystring.stringify(response);
    };  
}

function Anonymous() {
    this.name = "ANONYMOUS";
    this.auth = function() {
        return this.authzid;
    };
}

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
    this.challenge = function(s) {
        var dict = parseDict(s);
        if (dict.realm)
            this.realm = dict.realm;
        //require('sys').puts("dict: "+JSON.stringify(dict));

        var response;
        if (dict.nonce && dict.qop) {
            this.nonce_count++;
            var a1 = md5(this.authcid + ':' +
                         this.realm + ':' +
                         this.password) + ':' +
                             dict.nonce + ':' +
                             this.cnonce + ':' +
                             this.authzid;
            var a2 = "AUTHENTICATE:" + this.digest_uri;
            if (dict.qop == 'auth-int' || dict.qop == 'auth-conf')
                a2 += ":00000000000000000000000000000000";
            var responseValue = md5_hex(md5_hex(a1) + ':' +
                                        dict.nonce + ':' +
                                        this.getNC() + ':' +
                                        this.cnonce + ':' +
                                        dict.qop + ':' +
                                        md5_hex(a2)
                                       );
            response = {
                username: this.authcid,
                realm: this.realm,
                nonce: dict.nonce,
                cnonce: this.cnonce,
                nc: this.getNC(),
                qop: dict.qop,
                'digest-uri': this.digest_uri,
                response: responseValue,
                authzid: this.authzid,
                charset: 'utf-8'
            };
        } else if (dict.rspauth) {
            return "";
        }
        //require('sys').puts('response: '+JSON.stringify(response));
        return encodeDict(response);
    };
}

function parseDict(s) {
    var result = {};
    while (s) {
        var m;

        if ((m = /^(.+?)="(.*?[^\\])",(.*)/.exec(s))) {
            result[m[1]] = m[2];
            s = m[3];
        } else if ((m = /^(.+?)="(.*?[^\\])"$/.exec(s))) {
            result[m[1]] = m[2];
            s = m[3];
        } else if ((m = /^(.+?)=(.+?),(.*)/.exec(s))) {
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

function encodeDict(dict) {
    var s = "";
    for(k in dict) {
        var v = dict[k];
        if (v)
            s += ',' + k + '="' + v + '"';
    }
    return s.substr(1);  // without first ','
}

function rjust(s, targetLen, padding) {
    while(s.length < targetLen)
        s = padding + s;
    return s;
}

function md5(s, encoding) {
    var hash = crypto.createHash('md5');
    hash.update(s);
    return hash.digest(encoding || 'binary');
}

function md5_hex(s) {
    return md5(s, 'hex');
}

function generateNonce() {
    var result = "";
    for(var i = 0; i < 8; i++)
        result += String.fromCharCode(48 +
                                      Math.ceil(Math.random() * 10));
    return result;
}
