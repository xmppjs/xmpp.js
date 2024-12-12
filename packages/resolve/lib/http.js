"use strict";

// eslint-disable-next-line n/no-unsupported-features/node-builtins
const fetch = globalThis.fetch || require("node-fetch");
const parse = require("@xmpp/xml/lib/parse");
const compareAltConnections = require("./alt-connections").compare;

function resolve(domain) {
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

module.exports.resolve = resolve;
