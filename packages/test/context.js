"use strict";

const client = require("./client");
const { promise } = require("@xmpp/events");
const xml = require("@xmpp/xml");
const debug = require("@xmpp/debug");
const JID = require("@xmpp/jid");
const mockSocket = require("./mockSocket");
const clone = require("ltx/lib/clone");

module.exports = function context(entity = client()) {
  debug(entity);

  entity.socket = mockSocket();
  entity.jid = new JID("foo@bar/test");

  const ctx = {
    entity,
    sanitize(s) {
      const stanza = clone(s);
      const { id } = stanza.attrs;
      delete stanza.attrs.id;
      delete stanza.attrs.xmlns;
      return { stanza, id };
    },
    catch() {
      return promise(entity, "send").then((s) => this.sanitize(s));
    },
    catchOutgoing(match = () => true) {
      return new Promise((resolve) => {
        function onSend(stanza) {
          if (match(stanza)) {
            entity.removeListener("send", onSend);
            resolve(stanza);
          }
        }

        entity.on("send", onSend);
      });
    },
    catchOutgoingIq(match = () => true) {
      return this.catchOutgoing((stanza) => stanza.is("iq") && match(stanza));
    },
    async catchOutgoingGet(match = () => true) {
      const stanza = await this.catchOutgoingIq(
        (stanza) => stanza.attrs.type === "get" && match(stanza),
      );
      const [child] = stanza.children;
      if (child) {
        child.parent = null;
      }

      return child;
    },
    async catchOutgoingSet(match = () => true) {
      const stanza = await this.catchOutgoingIq(
        (stanza) => stanza.attrs.type === "set" && match(stanza),
      );
      const [child] = stanza.children;
      if (child) {
        child.parent = null;
      }

      return child;
    },
    scheduleIncomingResult(child) {
      return promise(entity, "send").then((stanza) => {
        const { id } = stanza.attrs;
        return this.fakeIncomingResult(child, id);
      });
    },
    scheduleIncomingError(child) {
      return promise(entity, "send").then((stanza) => {
        const { id } = stanza.attrs;
        return this.fakeIncomingError(child, id);
      });
    },
    fakeIncomingGet(child, attrs = {}) {
      attrs.type = "get";
      return this.fakeIncomingIq(xml("iq", attrs, child)).then((stanza) => {
        const [child] = stanza.children;
        if (child) {
          child.parent = null;
        }

        return child;
      });
    },
    fakeIncomingSet(child, attrs = {}) {
      attrs.type = "set";
      return this.fakeIncomingIq(xml("iq", attrs, child)).then((stanza) => {
        const [child] = stanza.children;
        if (child) {
          child.parent = null;
        }

        return child;
      });
    },
    fakeIncomingResult(child, id) {
      return this.fakeIncomingIq(xml("iq", { type: "result", id }, child)).then(
        (stanza) => {
          const [child] = stanza.children;
          if (child) {
            child.parent = null;
          }

          return child;
        },
      );
    },
    fakeIncomingError(child, id) {
      return this.fakeIncomingIq(xml("iq", { type: "error", id }, child)).then(
        (stanza) => {
          const [child] = stanza.children;
          if (child) {
            child.parent = null;
          }

          return child;
        },
      );
    },
    fakeIncomingIq(el) {
      const stanza = clone(el);
      if (stanza.is("iq") && !stanza.attrs.id) {
        stanza.attrs.id = "fake";
      }

      return this.fakeIncoming(stanza);
    },
    async fakeIncoming(el) {
      const p = promise(entity, "send");
      const stanza = clone(el);
      delete stanza.attrs.xmlns;
      await Promise.resolve();
      this.mockInput(el);
      await p;
      return this.sanitize(el).stanza;
    },
    fakeOutgoing(el) {
      entity.hookOutgoing(el);
    },
    mockInput(el) {
      entity.emit("input", el.toString());
      entity._onElement(el);
    },
  };

  return ctx;
};
