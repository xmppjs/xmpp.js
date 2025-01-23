/* eslint-disable no-console, n/no-extraneous-import*/

import { client, xml } from "@xmpp/client";
import debug from "@xmpp/debug";

// Insecure!
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const xmpp = client({
  service: "ws://localhost:5280/xmpp-websocket",
  // service: "xmpps://localhost:5223",
  // service: "xmpp://localhost:5222",
  domain: "localhost",
  resource: "example",
  username: "username",
  password: "password",
});

debug(xmpp, true);

xmpp.on("error", (err) => {
  console.error(err);
});

xmpp.on("offline", () => {
  console.log("offline");
});

xmpp.on("stanza", onStanza);
async function onStanza(stanza) {
  if (stanza.is("message")) {
    xmpp.removeListener("stanza", onStanza);
    await xmpp.send(xml("presence", { type: "unavailable" }));
    await xmpp.stop();
  }
}

xmpp.on("online", async (address) => {
  console.log("online as", address.toString());

  // Makes itself available
  await xmpp.send(xml("presence"));

  // Sends a chat message to itself
  const message = xml(
    "message",
    { type: "chat", to: address },
    xml("body", {}, "hello world"),
  );
  await xmpp.send(message);
});

await xmpp.start();
