import context from "./context.js";
import xml from "@xmpp/xml";
import jid from "@xmpp/jid";
import mockClient from "./mockClient.js";
import mockClientCore from "./mockClientCore.js";
import { delay, promise, timeout } from "@xmpp/events";
import id from "@xmpp/id";

export {
  context,
  xml,
  jid,
  jid as JID,
  mockClient,
  mockClientCore,
  delay,
  promise,
  timeout,
  id,
};

export function mockInput(entity, el) {
  entity.emit("input", el.toString());
  entity._onElement(el);
}

export async function promiseSend(entity) {
  const stanza = await promise(entity, "send", "");
  delete stanza.attrs.xmlns;
  return stanza;
}

export function promiseError(entity) {
  return promise(entity, "error", "");
}
