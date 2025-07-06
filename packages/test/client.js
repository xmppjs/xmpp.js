import { Client } from "@xmpp/client-core";
import JID from "@xmpp/jid";

import mockSocket from "./mockSocket";

export default function client(entity = new Client()) {
  entity.socket = mockSocket();
  entity.jid = new JID("foo@bar/test");
  return entity;
}
