"use strict";

const xml = require("@xmpp/xml");
const { canUpgrade, upgrade } = require("./starttls");

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

module.exports = function starttls({ streamFeatures }) {
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
};
