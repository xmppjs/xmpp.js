'use strict';

var nameprep, toUnicode, resourceprep, nodeprep

var identity = function(a) {
    return a
}
var toLower = function(a) {
    return a.toLowerCase()
}

try {
    var StringPrep = require('node-stringprep').StringPrep
    var toUnicode = require('node-stringprep').toUnicode
    var c = function(n) {
        var p = new StringPrep(n)
        return function(s) {
            try {
                return p.prepare(s)
            } catch (e) {
                switch (n) {
                case 'nameprep':
                    return toLower
                case 'nodeprep':
                    return toLower
                case 'resourceprep':
                    return identity
                }
            }
        }
    }
    nameprep = c('nameprep')
    nodeprep = c('nodeprep')
    resourceprep = c('resourceprep')
} catch (ex) {
    console.warn(
        'Cannot load StringPrep-0.1.0 bindings. You ' +
        'may need to `npm install node-stringprep`'
    )
    toUnicode = identity
    nameprep = toLower
    nodeprep = toLower
    resourceprep = identity
}

function JID(a, b, c) {
    if (a && (!b) && (!c)) {
        this.parseJID(a)
    } else if (b) {
        this.setLocal(a)
        this.setDomain(b)
        this.setResource(c)
    } else
        throw new Error('Argument error')
}

JID.prototype.parseJID = function(s) {
    if (s.indexOf('@') >= 0) {
        this.setLocal(s.substr(0, s.indexOf('@')))
        s = s.substr(s.indexOf('@') + 1)
    }
    if (s.indexOf('/') >= 0) {
        this.setResource(s.substr(s.indexOf('/') + 1))
        s = s.substr(0, s.indexOf('/'))
    }
    this.setDomain(s)
}

JID.prototype.toString = function() {
    var s = this.domain
    if (this.local) s = this.local + '@' + s
    if (this.resource) s = s + '/' + this.resource
    return s
}

/**
 * Convenience method to distinguish users
 **/
JID.prototype.bare = function() {
    if (this.resource) {
        return new JID(this.local, this.domain, null)
    } else {
        return this
    }
}

/**
 * Comparison function
 **/
JID.prototype.equals = function(other) {
    return (this.local === other.local) &&
        (this.domain === other.domain) &&
        (this.resource === other.resource)
}

/* Deprecated, use setLocal() [see RFC6122] */
JID.prototype.setUser = function(user) {
    this.setLocal(user)
}

/**
 * Setters that do stringprep normalization.
 **/
JID.prototype.setLocal = function(local) {
    this.local = this.user = local && nodeprep(local)
}

/**
 * http://xmpp.org/rfcs/rfc6122.html#addressing-domain
 */
JID.prototype.setDomain = function(domain) {
    this.domain = domain &&
        nameprep(domain.split('.').map(toUnicode).join('.'))
}

JID.prototype.setResource = function(resource) {
    this.resource = resource && resourceprep(resource)
}

JID.prototype.getLocal = function() {
    return this.local
}

/* Deprecated, use getLocal() [see RFC6122] */
JID.prototype.getUser = function() {
    return this.getLocal()
}

JID.prototype.getDomain = function() {
    return this.domain
}

JID.prototype.getResource = function() {
    return this.resource
}

if ((typeof exports !== 'undefined') && (exports !== null)) {
    module.exports = JID
} else if ((typeof window !== 'undefined') && (window !== null)) {
    window.JID = JID
}
