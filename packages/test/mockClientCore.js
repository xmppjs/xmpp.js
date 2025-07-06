import { Client } from "@xmpp/client-core";
import Connection from "@xmpp/connection";

import context from "./context.js";

export default function mockClient(options) {
  const xmpp = new Client(options);
  xmpp.send = Connection.prototype.send;
  const ctx = context(xmpp);
  return Object.assign(xmpp, ctx);
}
