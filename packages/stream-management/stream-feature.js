import XMPPError from "@xmpp/error";
import { procedure } from "@xmpp/events";

import { NS, makeEnableElement, makeResumeElement } from "./index.js";

export function setupStreamFeature({
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

    if (sm.outbound_q.length > 0) {
      throw new Error(
        "Stream Management assertion failure, queue should be empty after enable",
      );
    }

    // > The counter for an entity's own sent stanzas is set to zero and started after sending either <enable/> or <enabled/>.
    // https://xmpp.org/extensions/xep-0198.html#example-7
    sm.outbound = 0;

    try {
      const response = await promiseEnable;
      enabled(response.attrs);
    } catch {
      sm.enabled = false;
      sm.enableSent = false;
    }
  });
}

export function enable(entity, sm) {
  return procedure(entity, makeEnableElement({ sm }), (element, done) => {
    if (element.is("enabled", NS)) {
      return done(element);
    } else if (element.is("failed", NS)) {
      throw XMPPError.fromElement(element);
    }
  });
}

export async function resume(entity, sm) {
  return procedure(entity, makeResumeElement({ sm }), (element, done) => {
    if (element.is("resumed", NS)) {
      return done(element);
    } else if (element.is("failed", NS)) {
      throw XMPPError.fromElement(element);
    }
  });
}
