import XMPPError from "@xmpp/error";
import { EventEmitter, procedure } from "@xmpp/events";
import xml from "@xmpp/xml";
import { datetime } from "@xmpp/time";

// https://xmpp.org/extensions/xep-0198.html

const NS = "urn:xmpp:sm:3";

function makeEnableElement({ sm }) {
  return xml("enable", {
    xmlns: NS,
    max: sm.preferredMaximum,
    resume: sm.allowResume ? "true" : undefined,
  });
}

function makeResumeElement({ sm }) {
  return xml("resume", { xmlns: NS, h: sm.inbound, previd: sm.id });
}

function enable(entity, sm) {
  return procedure(entity, makeEnableElement({ sm }), (element, done) => {
    if (element.is("enabled", NS)) {
      return done(element);
    } else if (element.is("failed", NS)) {
      throw XMPPError.fromElement(element);
    }
  });
}

async function resume(entity, sm) {
  return procedure(entity, makeResumeElement({ sm }), (element, done) => {
    if (element.is("resumed", NS)) {
      return done(element);
    } else if (element.is("failed", NS)) {
      throw XMPPError.fromElement(element);
    }
  });
}

export default function streamManagement({
  streamFeatures,
  entity,
  middleware,
  bind2,
  sasl2,
}) {
  let timeoutTimeout = null;
  let requestAckTimeout = null;

  const sm = new EventEmitter();
  Object.assign(sm, {
    allowResume: true,
    preferredMaximum: null,
    enabled: false,
    id: "",
    outbound_q: [],
    outbound: 0,
    inbound: 0,
    max: null,
    timeout: 60_000,
    requestAckInterval: 300_000,
    debounceAckRequest: 100,
    _teardown: () => {
      clearTimeout(timeoutTimeout);
      clearTimeout(requestAckTimeout);
    },
  });

  async function sendQueueItem({ stanza, stamp }) {
    if (
      stanza.name === "message" &&
      !stanza.getChild("delay", "urn:xmpp:delay")
    ) {
      stanza.append(xml("delay", {
        xmlns: "urn:xmpp:delay",
        from: entity.jid.toString(),
        stamp: stamp,
      }));
    }
    await entity.send(stanza);
  }

  async function resumed(resumed) {
    sm.enabled = true;
    const oldOutbound = sm.outbound;
    for (let i = 0; i < resumed.attrs.h - oldOutbound; i++) {
      let item = sm.outbound_q.shift();
      sm.outbound++;
      sm.emit("ack", item.stanza);
    }
    let q = sm.outbound_q;
    sm.outbound_q = [];
    for (const item of q) {
      await sendQueueItem(item); // This will trigger the middleware and re-add to the queue
    }
    sm.emit("resumed");
    entity._ready(true);
  }

  function failed() {
    sm.enabled = false;
    sm.id = "";
    let item;
    while ((item = sm.outbound_q.shift())) {
      sm.emit("fail", item.stanza);
    }
    sm.outbound = 0;
  }

  function enabled({ id, max }) {
    sm.enabled = true;
    sm.id = id;
    sm.max = max;
  }

  entity.on("online", () => {
    if (sm.outbound_q.length > 0) {
      throw new Error(
        "Stream Management assertion failure, queue should be empty during online",
      );
    }
    sm.outbound = 0;
    sm.inbound = 0;
  });

  entity.on("offline", () => {
    let stanza;
    while ((stanza = sm.outbound_q.shift())) {
      sm.emit("fail", stanza);
    }
    sm.outbound = 0;
    sm.inbound = 0;
    sm.enabled = false;
    sm.id = "";
  });

  middleware.use((context, next) => {
    const { stanza } = context;
    clearTimeout(timeoutTimeout);
    if (["presence", "message", "iq"].includes(stanza.name)) {
      sm.inbound += 1;
    } else if (stanza.is("r", NS)) {
      // > When an <r/> element ("request") is received, the recipient MUST acknowledge it by sending an <a/> element to the sender containing a value of 'h' that is equal to the number of stanzas handled by the recipient of the <r/> element.
      entity.send(xml("a", { xmlns: NS, h: sm.inbound })).catch(() => {});
    } else if (stanza.is("a", NS)) {
      // > When a party receives an <a/> element, it SHOULD keep a record of the 'h' value returned as the sequence number of the last handled outbound stanza for the current stream (and discard the previous value).
      const oldOutbound = sm.outbound;
      for (let i = 0; i < stanza.attrs.h - oldOutbound; i++) {
        let item = sm.outbound_q.shift();
        sm.outbound++;
        sm.emit("ack", item.stanza);
      }
    }

    return next();
  });

  if (bind2) {
    setupBind2({ bind2, sm, failed, enabled });
  }
  if (sasl2) {
    setupSasl2({ sasl2, sm, failed, resumed });
  }

  function requestAck() {
    clearTimeout(timeoutTimeout);
    if (sm.timeout) {
      timeoutTimeout = setTimeout(
        () => entity.disconnect().catch(),
        sm.timeout,
      );
    }
    entity.send(xml("r", { xmlns: NS })).catch(() => {});
    // Periodically send r to check the connection
    // If a stanza goes out it will cancel this and set a sooner timer
    requestAckTimeout = setTimeout(requestAck, sm.requestAckInterval);
  }

  middleware.filter((context, next) => {
    if (!sm.enabled) return next();
    const { stanza } = context;
    if (!["presence", "message", "iq"].includes(stanza.name)) return next();

    sm.outbound_q.push({ stanza, stamp: datetime() });
    // Debounce requests so we send only one after a big run of stanza together
    clearTimeout(requestAckTimeout);
    requestAckTimeout = setTimeout(requestAck, sm.debounceAckRequest);
    return next();
  });

  if (streamFeatures) {
    setupStreamFeature({
      streamFeatures,
      sm,
      entity,
      resumed,
      failed,
      enabled,
    });
  }

  return sm;
}

function setupStreamFeature({
  streamFeatures,
  sm,
  entity,
  resumed,
  failed,
  enabled,
}) {
  // https://xmpp.org/extensions/xep-0198.html#enable
  // For client-to-server connections, the client MUST NOT attempt to enable stream management until after it has completed Resource Binding unless it is resuming a previous session
  streamFeatures.use("sm", NS, async (context, next) => {
    // Resuming
    if (sm.id) {
      try {
        const element = await resume(entity, sm);
        await resumed(element);
        return;
        // If resumption fails, continue with session establishment
      } catch {
        failed();
      }
    }

    // Enabling

    // Resource binding first
    await next();

    const promiseEnable = enable(entity, sm);

    // > The counter for an entity's own sent stanzas is set to zero and started after sending either <enable/> or <enabled/>.
    if (sm.outbound_q.length > 0) {
      throw new Error(
        "Stream Management assertion failure, queue should be empty after enable",
      );
    }
    sm.outbound = 0;

    try {
      const response = await promiseEnable;
      enabled(response.attrs);
    } catch {
      sm.enabled = false;
    }

    sm.inbound = 0;
  });
}

function setupSasl2({ sasl2, sm, failed, resumed }) {
  sasl2.use(
    "urn:xmpp:sm:3",
    (element) => {
      if (!element.is("sm")) return;
      if (sm.id) return makeResumeElement({ sm });
    },
    (element) => {
      if (element.is("resumed")) {
        resumed(element);
      } else if (element.is(failed)) {
        // const error = StreamError.fromElement(element)
        failed();
      }
    },
  );
}

function setupBind2({ bind2, sm, failed, enabled }) {
  bind2.use(
    "urn:xmpp:sm:3",
    // https://xmpp.org/extensions/xep-0198.html#inline-examples
    (_element) => {
      return makeEnableElement({ sm });
    },
    (element) => {
      if (element.is("enabled")) {
        enabled(element.attrs);
      } else if (element.is("failed")) {
        // const error = StreamError.fromElement(element)
        failed();
      }
    },
  );
}
