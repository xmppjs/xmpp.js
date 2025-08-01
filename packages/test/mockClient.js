import { client } from "@xmpp/client";
import Connection from "@xmpp/connection";

import context from "./context.js";

export default function mockClient(options) {
  const xmpp = client(options);
  xmpp.send = Connection.prototype.send;
  xmpp.sendMany = async (stanzas) => {
    for (const stanza of stanzas) {
      await xmpp.send(stanza);
    }
  };
  const ctx = context(xmpp);
  return Object.assign(xmpp, ctx);
}
