"use strict";

const escaping = require("./escaping");

/**
 * JID implements
 * - XMPP addresses according to RFC6122
 * - XEP-0106: JID Escaping
 *
 * @see http://tools.ietf.org/html/rfc6122#section-2
 * @see http://xmpp.org/extensions/xep-0106.html
 */
class JID {
  constructor(local, domain, resource) {
    if (typeof domain !== "string" || !domain) {
      throw new TypeError(`Invalid domain.`);
    }

    this.setDomain(domain);
    this.setLocal(typeof local === "string" ? local : "");
    this.setResource(typeof resource === "string" ? resource : "");
  }

  [Symbol.toPrimitive](hint) {
    if (hint === "number") {
      return NaN;
    }

    return this.toString();
  }

  toString(unescape) {
    let s = this._domain;
    if (this._local) {
      s = this.getLocal(unescape) + "@" + s;
    }

    if (this._resource) {
      s = s + "/" + this._resource;
    }

    return s;
  }

  /**
   * Convenience method to distinguish users
   * */
  bare() {
    if (this._resource) {
      return new JID(this._local, this._domain, null);
    }

    return this;
  }

  /**
   * Comparison function
   * */
  equals(other) {
    return (
      this._local === other._local &&
      this._domain === other._domain &&
      this._resource === other._resource
    );
  }

  /**
   * http://xmpp.org/rfcs/rfc6122.html#addressing-localpart
   * */
  setLocal(local, escape) {
    escape = escape || escaping.detect(local);

    if (escape) {
      local = escaping.escape(local);
    }

    this._local = local && local.toLowerCase();
    return this;
  }

  getLocal(unescape = false) {
    let local = null;

    local = unescape ? escaping.unescape(this._local) : this._local;

    return local;
  }

  /**
   * http://xmpp.org/rfcs/rfc6122.html#addressing-domain
   */
  setDomain(domain) {
    this._domain = domain.toLowerCase();
    return this;
  }

  getDomain() {
    return this._domain;
  }

  /**
   * http://xmpp.org/rfcs/rfc6122.html#addressing-resourcepart
   */
  setResource(resource) {
    this._resource = resource;
    return this;
  }

  getResource() {
    return this._resource;
  }
}

Object.defineProperty(JID.prototype, "local", {
  get: JID.prototype.getLocal,
  set: JID.prototype.setLocal,
});

Object.defineProperty(JID.prototype, "domain", {
  get: JID.prototype.getDomain,
  set: JID.prototype.setDomain,
});

Object.defineProperty(JID.prototype, "resource", {
  get: JID.prototype.getResource,
  set: JID.prototype.setResource,
});

module.exports = JID;
