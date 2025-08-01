import xml from "@xmpp/xml";

import { canUpgrade, upgrade } from "./starttls.js";

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#tls
 */

const NS = "urn:ietf:params:xml:ns:xmpp-tls";

async function negotiate(entity) {
  const element = await entity.sendReceive(xml("starttls", { xmlns: NS }));
  if (element.is("proceed", NS)) {
    return element;
  }

  throw new Error("STARTTLS_FAILURE");
}

export default function starttls({ streamFeatures }) {
  return streamFeatures.use("starttls", NS, async ({ entity }, next) => {
    const { socket, options } = entity;
    if (!canUpgrade(socket)) {
      return next();
    }

    await negotiate(entity);
    const tlsSocket = await upgrade(socket, { host: options.domain });
    entity._attachSocket(tlsSocket);

    await entity.restart();
  });
}
