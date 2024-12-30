import { client, xml } from "@xmpp/client";
// eslint-disable-next-line n/no-extraneous-import
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
  userAgent: xml("user-agent", { id: "foobar" }, [
    xml("software", {}, "wow"),
    xml("device", {}, "man"),
  ]),
});

debug(xmpp, true);

xmpp.on("error", (err) => {
  console.error(err);
});

xmpp.on("offline", () => {
  console.log("offline");
});

xmpp.once("stanza", async (stanza) => {
  if (stanza.is("message")) {
    await xmpp.send(xml("presence", { type: "unavailable" }));
    await xmpp.stop();
  }
});

xmpp.on("online", async (address) => {
  console.log("online as", address.toString());

  setTimeout(() => {
    xmpp.disconnect();
  }, 100);

  return;

  // Makes itself available
  // await xmpp.send(xml("presence"));

  // Sends a chat message to itself
  const message = xml(
    "message",
    { type: "chat", to: address },
    xml("body", {}, "hello world"),
  );
  await xmpp.send(message);
});

await xmpp.start();
