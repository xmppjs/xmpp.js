"use strict";

const xid = require("@xmpp/id");
const StanzaError = require("@xmpp/middleware/lib/StanzaError");
const { Deferred } = require("@xmpp/events");
const timeoutPromise = require("@xmpp/events").timeout;
const xml = require("@xmpp/xml");

function isReply({ name, type }) {
  if (name !== "iq") return false;
  if (type !== "error" && type !== "result") return false;
  return true;
}

class IQCaller {
  constructor({ entity, middleware }) {
    this.handlers = new Map();
    this.entity = entity;
    this.middleware = middleware;
  }

  start() {
    this.middleware.use(this._route.bind(this));
  }

  _route({ type, name, id, stanza }, next) {
    if (!isReply({ name, type })) return next();

    const deferred = this.handlers.get(id);

    if (!deferred) {
      return next();
    }

    if (type === "error") {
      deferred.reject(StanzaError.fromElement(stanza.getChild("error")));
    } else {
      deferred.resolve(stanza);
    }

    this.handlers.delete(id);
  }

  async request(stanza, timeout = 30 * 1000) {
    if (!stanza.attrs.id) {
      stanza.attrs.id = xid();
    }

    const deferred = new Deferred();
    this.handlers.set(stanza.attrs.id, deferred);

    try {
      await this.entity.send(stanza);
      await timeoutPromise(deferred.promise, timeout);
    } catch (err) {
      this.handlers.delete(stanza.attrs.id);
      throw err;
    }

    return deferred.promise;
  }

  _childRequest(type, element, to, ...args) {
    const {
      name,
      attrs: { xmlns },
    } = element;
    return this.request(xml("iq", { type, to }, element), ...args).then(
      (stanza) => stanza.getChild(name, xmlns),
    );
  }

  async get(...args) {
    return this._childRequest("get", ...args);
  }

  async set(...args) {
    return this._childRequest("set", ...args);
  }
}

module.exports = function iqCaller(...args) {
  const iqCaller = new IQCaller(...args);
  iqCaller.start();
  return iqCaller;
};
