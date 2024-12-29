import { component, xml } from "@xmpp/component";
// eslint-disable-next-line n/no-extraneous-import
import debug from "@xmpp/debug";

const xmpp = component({
  service: "xmpp://localhost:5347",
  domain: "component.localhost",
  password: "mysecretcomponentpassword",
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
    await xmpp.stop();
  }
});

xmpp.on("online", async (address) => {
  console.log("online as", address.toString());

  // Sends a chat message to itself
  const message = xml(
    "message",
    { type: "chat", to: address },
    xml("body", {}, "hello world"),
  );
  await xmpp.send(message);
});

await xmpp.start();
