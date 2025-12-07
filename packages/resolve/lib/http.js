import parse from "@xmpp/xml/lib/parse.js";

import { compare as compareAltConnections } from "./alt-connections.js";

export async function resolve(domain) {
  try {
    const res = await fetch(`https://${domain}/.well-known/host-meta`);
    const text = await res.text();
    return parse(text)
      .getChildren("Link")
      .filter((link) =>
        [
          "urn:xmpp:alt-connections:websocket",
          "urn:xmpp:alt-connections:httppoll",
          "urn:xmpp:alt-connections:xbosh",
        ].includes(link.attrs.rel),
      )
      .map(({ attrs }) => ({
        rel: attrs.rel,
        href: attrs.href,
        method: attrs.rel.split(":").pop(),
        uri: attrs.href,
      }))
      .toSorted(compareAltConnections);
  } catch {
    return [];
  }
}
