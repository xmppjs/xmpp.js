import stringify from "ltx/lib/stringify.js";
import xml from "@xmpp/xml";
import clone from "ltx/lib/clone.js";

/* eslint no-console: 0 */

const NS_SASL = "urn:ietf:params:xml:ns:xmpp-sasl";
const NS_COMPONENT = "jabber:component:accept";

const SENSITIVES = [
  ["handshake", NS_COMPONENT],
  ["auth", NS_SASL],
  ["challenge", NS_SASL],
  ["response", NS_SASL],
  ["success", NS_SASL],
];

function isSensitive(element) {
  if (element.children.length === 0) return false;
  return SENSITIVES.some((sensitive) => {
    return element.is(...sensitive);
  });
}

export function hideSensitive(element) {
  if (isSensitive(element)) {
    element.children = [];
    element.append(xml("hidden", { xmlns: "xmpp.js" }));
  }

  return element;
}

function format(element) {
  return stringify(hideSensitive(clone(element), 2));
}

export default function debug(entity, force) {
  if (process.env.XMPP_DEBUG || force === true) {
    entity.on("element", (data) => {
      console.debug(`IN\n${format(data)}`);
    });

    entity.on("send", (data) => {
      console.debug(`OUT\n${format(data)}`);
    });

    entity.on("error", console.error);

    entity.on("status", (status, value) => {
      console.debug("status", status, value ? value.toString() : "");
    });
  }
}
