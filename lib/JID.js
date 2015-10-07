'use strict'

/**
 * JID implements
 * - Xmpp addresses according to RFC6122
 * - XEP-0106: JID Escaping
 *
 * @see http://tools.ietf.org/html/rfc6122#section-2
 * @see http://xmpp.org/extensions/xep-0106.html
 */
function JID(a, b, c) {
    this.local = null
    this.domain = null
    this.resource = null

    if (a && (!b) && (!c)) {
        this.parseJID(a)
    } else if (b) {
        this.setLocal(a)
        this.setDomain(b)
        this.setResource(c)
    } else {
        throw new Error('Argument error')
    }
}

JID.prototype.parseJID = function(s) {
    if (s.indexOf('@') >= 0) {
        this.setLocal(s.substr(0, s.lastIndexOf('@')))
        s = s.substr(s.lastIndexOf('@') + 1)
    }
    if (s.indexOf('/') >= 0) {
        this.setResource(s.substr(s.indexOf('/') + 1))
        s = s.substr(0, s.indexOf('/'))
    }
    this.setDomain(s)
}

JID.prototype.toString = function(unescape) {
    var s = this.domain
    if (this.local) s = this.getLocal(unescape) + '@' + s
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

/**
 * http://xmpp.org/rfcs/rfc6122.html#addressing-localpart
 **/
JID.prototype.setLocal = function(local, escape) {
    escape = escape || this.detectEscape(local)

    if (escape) {
        local = this.escapeLocal(local)
    }

    this.local = local && local.toLowerCase()
    this.user = this.local
    return this
}

JID.prototype.setUser = function() {
    console.log('JID.setUser: Use JID.setLocal instead')
    this.setLocal.apply(this, arguments)
}

/**
 * http://xmpp.org/rfcs/rfc6122.html#addressing-domain
 */
JID.prototype.setDomain = function(domain) {
    this.domain = domain.toLowerCase()
    return this
}

/**
 * http://xmpp.org/rfcs/rfc6122.html#addressing-resourcepart
 */
JID.prototype.setResource = function(resource) {
    this.resource = resource
    return this
}

JID.prototype.getUser = function() {
    console.log('JID.getUser: Use JID.getLocal instead')
    return this.getLocal.apply(this, arguments)
}

JID.prototype.getLocal = function(unescape) {
    unescape = unescape || false
    var local = null

    if (unescape) {
        local = this.unescapeLocal(this.local)
    } else {
        local = this.local
    }

    return local
}

JID.prototype.getDomain = function() {
    return this.domain
}

JID.prototype.getResource = function() {
    return this.resource
}

JID.prototype.detectEscape = function (local) {
    if (!local) return false

    // remove all escaped secquences
    var tmp = local.replace(/\\20/g, '')
        .replace(/\\22/g, '')
        .replace(/\\26/g, '')
        .replace(/\\27/g, '')
        .replace(/\\2f/g, '')
        .replace(/\\3a/g, '')
        .replace(/\\3c/g, '')
        .replace(/\\3e/g, '')
        .replace(/\\40/g, '')
        .replace(/\\5c/g, '')

    // detect if we have unescaped sequences
    var search = tmp.search(/\\| |\"|\&|\'|\/|:|<|>|@/g)
    if (search === -1) {
        return false
    } else {
        return true
    }
}

/**
 * Escape the local part of a JID.
 *
 * @see http://xmpp.org/extensions/xep-0106.html
 * @param String local local part of a jid
 * @return An escaped local part
 */
JID.prototype.escapeLocal = function (local) {
    if (local === null) return null

    return local.replace(/^\s+|\s+$/g, '')
        .replace(/\\/g, '\\5c')
        .replace(/ /g, '\\20')
        .replace(/\"/g, '\\22')
        .replace(/\&/g, '\\26')
        .replace(/\'/g, '\\27')
        .replace(/\//g, '\\2f')
        .replace(/:/g, '\\3a')
        .replace(/</g, '\\3c')
        .replace(/>/g, '\\3e')
        .replace(/@/g, '\\40')
        .replace(/\3a/g, '\u0005c3a')
}

/**
 * Unescape a local part of a JID.
 *
 * @see http://xmpp.org/extensions/xep-0106.html
 * @param String local local part of a jid
 * @return unescaped local part
 */
JID.prototype.unescapeLocal = function (local) {
    if (local === null) return null

    return local.replace(/\\20/g, ' ')
        .replace(/\\22/g, '\"')
        .replace(/\\26/g, '&')
        .replace(/\\27/g, '\'')
        .replace(/\\2f/g, '/')
        .replace(/\\3a/g, ':')
        .replace(/\\3c/g, '<')
        .replace(/\\3e/g, '>')
        .replace(/\\40/g, '@')
        .replace(/\\5c/g, '\\')
}

module.exports = JID
