import xml from "@xmpp/xml";

/*
 * References
 * https://xmpp.org/rfcs/rfc6120.html#bind
 */

const NS = "urn:ietf:params:xml:ns:xmpp-bind";

function makeBindElement(resource) {
  return xml("bind", { xmlns: NS }, resource && xml("resource", {}, resource));
}

async function bind(entity, iqCaller, resource) {
  const result = await iqCaller.set(makeBindElement(resource));
  const jid = result.getChildText("jid");
  entity._jid(jid);
  entity._ready(false);
  return jid;
}

function route({ iqCaller }, resource) {
  return async ({ entity }, next) => {
    resource = typeof resource === "function" ? await resource() : resource;
    await bind(entity, iqCaller, resource);
    next();
  };
}

export default function resourceBinding(
  { streamFeatures, iqCaller },
  resource,
) {
  streamFeatures.use("bind", NS, route({ iqCaller }, resource));
}
