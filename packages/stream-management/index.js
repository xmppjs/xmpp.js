"use strict";

const xml = require("@xmpp/xml");
const time = require("@xmpp/time");

// https://xmpp.org/extensions/xep-0198.html

const NS = "urn:xmpp:sm:3";

async function enable(entity, resume, max) {
  await entity.send(
    xml("enable", { xmlns: NS, max, resume: resume ? "true" : undefined }),
  );

  return new Promise((resolve, reject) => {
    function listener(nonza) {
      if (nonza.is("enabled", NS)) {
        resolve(nonza);
      } else if (nonza.is("failed", NS)) {
        reject(nonza);
      } else {
        return;
      }

      entity.removeListener("nonza", listener);
    }

    entity.on("nonza", listener);
  });
}

async function resume(entity, h, previd) {
  const response = await entity.sendReceive(
    xml("resume", { xmlns: NS, h, previd }),
  );

  if (!response.is("resumed", NS)) {
    throw response;
  }

  return response;
}

module.exports = function streamManagement({
  streamFeatures,
  entity,
  middleware,
}) {
  let address = null;
  let timeoutTimeout = null;

  const sm = {
    allowResume: true,
    preferredMaximum: null,
    enabled: false,
    id: "",
    outbound_q: [],
    outbound: 0,
    inbound: 0,
    max: null,
    timeout: 60000,
  };

  entity.on("online", (jid) => {
    address = jid;
    if (sm.outbound_q.length > 0) {
      throw "Stream Management assertion failure, queue should be empty during online";
    }
    sm.outbound = 0;
    sm.inbound = 0;
  });

  entity.on("offline", () => {
    let stanza;
    while ((stanza = sm.outbound_q.shift())) {
      entity.emit("stream-management/fail", stanza);
    }
    sm.outbound = 0;
    sm.inbound = 0;
    sm.enabled = false;
    sm.id = "";
  });

  middleware.use((context, next) => {
    const { stanza } = context;
    if (timeoutTimeout) clearTimeout(timeoutTimeout);
    if (["presence", "message", "iq"].includes(stanza.name)) {
      sm.inbound += 1;
    } else if (stanza.is("r", NS)) {
      // > When an <r/> element ("request") is received, the recipient MUST acknowledge it by sending an <a/> element to the sender containing a value of 'h' that is equal to the number of stanzas handled by the recipient of the <r/> element.
      entity.send(xml("a", { xmlns: NS, h: sm.inbound })).catch(() => {});
    } else if (stanza.is("a", NS)) {
      // > When a party receives an <a/> element, it SHOULD keep a record of the 'h' value returned as the sequence number of the last handled outbound stanza for the current stream (and discard the previous value).
      const oldOutbound = sm.outbound;
      for (let i = 0; i < stanza.attrs.h - oldOutbound; i++) {
        let stanza = sm.outbound_q.shift();
        sm.outbound++;
        entity.emit("stream-management/ack", stanza);
      }
    }

    return next();
  });

  let requestAckTimeout = null;
  function requestAck() {
    if (timeoutTimeout) clearTimeout(timeoutTimeout);
    if (sm.timeout) {
      timeoutTimeout = setTimeout(() => entity.disconnect(), sm.timeout);
    }
    entity.send(xml("r", { xmlns: NS })).catch(() => {});
    // Periodically send r to check the connection
    // If a stanza goes out it will cancel this and set a sooner timer
    requestAckTimeout = setTimeout(requestAck, 300000);
  }

  middleware.filter((context, next) => {
    const { stanza } = context;
    if (sm.enabled && ["presence", "message", "iq"].includes(stanza.name)) {
      let qStanza = stanza;
      if (
        qStanza.name === "message" &&
        !qStanza.getChild("delay", "urn:xmpp:delay")
      ) {
        qStanza = xml.clone(stanza);
        qStanza.c("delay", {
          xmlns: "urn:xmpp:delay",
          from: entity.jid.toString(),
          stamp: time.datetime(),
        });
      }
      sm.outbound_q.push(qStanza);
      // Debounce requests so we send only one after a big run of stanza together
      if (requestAckTimeout) clearTimeout(requestAckTimeout);
      requestAckTimeout = setTimeout(requestAck, 100);
    }
    return next();
  });

  // https://xmpp.org/extensions/xep-0198.html#enable
  // For client-to-server connections, the client MUST NOT attempt to enable stream management until after it has completed Resource Binding unless it is resuming a previous session

  streamFeatures.use("sm", NS, async (context, next) => {
    // Resuming
    if (sm.id) {
      try {
        let resumed = await resume(entity, sm.inbound, sm.id);
        sm.enabled = true;
        if (address) entity.jid = address;
        entity.status = "online";
        const oldOutbound = sm.outbound;
        for (let i = 0; i < resumed.attrs.h - oldOutbound; i++) {
          let stanza = sm.outbound_q.shift();
          sm.outbound++;
          entity.emit("stream-management/ack", stanza);
        }
        let q = sm.outbound_q;
        sm.outbound_q = [];
        for (const item of q) {
          entity.send(item); // This will trigger the middleware and re-add to the queue
        }
        entity.emit("stream-management/resumed");
        return true;
        // If resumption fails, continue with session establishment
        // eslint-disable-next-line no-unused-vars
      } catch {
        sm.id = "";
        sm.enabled = false;
        let stanza;
        while ((stanza = sm.outbound_q.shift())) {
          entity.emit("stream-management/fail", stanza);
        }
        sm.outbound = 0;
      }
    }

    // Enabling

    // Resource binding first
    await next();

    const promiseEnable = enable(entity, sm.allowResume, sm.preferredMaximum);

    // > The counter for an entity's own sent stanzas is set to zero and started after sending either <enable/> or <enabled/>.
    if (sm.outbound_q.length > 0) {
      throw "Stream Management assertion failure, queue should be empty after enable";
    }
    sm.outbound = 0;

    try {
      const response = await promiseEnable;
      sm.enabled = true;
      sm.id = response.attrs.id;
      sm.max = response.attrs.max;
      // eslint-disable-next-line no-unused-vars
    } catch {
      sm.enabled = false;
    }

    sm.inbound = 0;
  });

  return sm;
};
