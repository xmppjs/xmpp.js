try {
    var StringPrep = require('node-stringprep').StringPrep;
    var nameprep = new StringPrep('nameprep');
    var nodeprep = new StringPrep('nodeprep');
    var resourceprep = new StringPrep('resourceprep');
} catch(ex) {
    var nameprep = null;
    var nodeprep = null;
    var resourceprep = null;
}

function JID(a, b, c) {
    if (a && b == null && c == null) {
        this.parseJID(a);
    } else if (b) {
        this.setUser(a);
        this.setDomain(b);
        this.setResource(c);
    } else
        throw 'Argument error';
}

JID.prototype.parseJID = function(s) {
    if (s.indexOf('@') >= 0) {
        this.setUser(s.substr(0, s.indexOf('@')));
        s = s.substr(s.indexOf('@') + 1);
    }
    if (s.indexOf('/') >= 0) {
        this.setResource(s.substr(s.indexOf('/') + 1));
        s = s.substr(0, s.indexOf('/'));
    }
    this.setDomain(s);
};

JID.prototype.toString = function() {
    var s = this.domain;
    if (this.user)
        s = this.user + '@' + s;
    if (this.resource)
        s = s + '/' + this.resource;
    return s;
};

/**
 * Convenience method to distinguish users
 **/
JID.prototype.bare = function() {
    if (this.resource)
        return new JID(this.user, this.domain, null);
    else
        return this;
};

/**
 * Comparison function
 **/
JID.prototype.equals = function(other) {
    return this.user == other.user &&
        this.domain == other.domain &&
        this.resource == other.resource;
};

/**
 * Setters that do stringprep normalization.
 **/
JID.prototype.setUser = function(user) {
    this.user = user && (nodeprep ? nodeprep.prepare(user) : user);
};
JID.prototype.setDomain = function(domain) {
    this.domain = domain && (nameprep ? nameprep.prepare(domain) : domain);
};
JID.prototype.setResource = function(resource) {
    this.resource = resource && (resourceprep ? resourceprep.prepare(resource) : resource);
};

exports.JID = JID;
