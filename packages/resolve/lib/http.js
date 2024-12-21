import parse from "@xmpp/xml/lib/parse.js";
import { compare as compareAltConnections } from "./alt-connections.js";

export async function resolve(domain) {
  // eslint-disable-next-line n/no-unsupported-features/node-builtins, unicorn/no-await-expression-member
  const fetch = globalThis.fetch || (await import("node-fetch")).default;
   
  return fetch(`https://${domain}/.well-known/host-meta`)
    .then((res) => res.text())
    .then((res) => {
      return parse(res)
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
        .sort(compareAltConnections);
    })
    .catch(() => {
      return [];
    });
}
