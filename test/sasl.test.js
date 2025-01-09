import { client, jid } from "../packages/client/index.js";
import debug from "../packages/debug/index.js";
import server from "../server/index.js";

const NS_SASL = "urn:ietf:params:xml:ns:xmpp-sasl";
const NS_BIND = "urn:ietf:params:xml:ns:xmpp-bind";
const NS_SASL2 = "urn:xmpp:sasl:2";
const NS_BIND2 = "urn:xmpp:bind:0";
const NS_FAST = "urn:xmpp:fast:0";

const username = "client";
const password = "foobar";
const credentials = { username, password };
const domain = "localhost";
const JID = jid(username, domain).toString();

let xmpp;

afterEach(async () => {
  await xmpp?.stop();
  await server.reset();
});

test("client online with sasl and resource binding", async () => {
  expect.assertions(6);

  await server.disableModules([
    "sasl2",
    "sasl2_bind2",
    "sasl2_sm",
    "sasl2_fast",
  ]);
  await server.enableModules(["saslauth"]);
  await server.restart();

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  xmpp.on("nonza", (element) => {
    if (!element.is("features")) return;

    expect(element.getChild("authentication", NS_SASL2)).toBe(undefined);
    if (element.getChild("mechanisms", NS_SASL)) expect.pass();
  });

  xmpp.on("send", (el) => {
    if (el.is("auth", NS_SASL)) expect().pass();
    if (el.is("iq") && el.getChild("bind", NS_BIND)) expect().pass();
  });

  const address = await xmpp.start();
  expect(address instanceof jid.JID).toBe(true);
  expect(address.bare().toString()).toBe(JID);
});

test("client online with sasl2 and bind2", async () => {
  expect.assertions(6);

  await server.disableModules(["saslauth"]);
  await server.enableModules(["sasl2", "sasl2_bind2"]);
  await server.restart();

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  xmpp.on("nonza", (element) => {
    if (!element.is("features")) return;

    expect(element.getChild("mechanisms", NS_SASL)).toBe(undefined);
    if (element.getChild("authentication", NS_SASL2)) expect.pass();
  });

  xmpp.on("send", (el) => {
    if (!el.is("authenticate", NS_SASL2)) return;
    expect().pass();
    if (el.getChild("bind", NS_BIND2)) expect().pass();
  });

  const address = await xmpp.start();
  expect(address instanceof jid.JID).toBe(true);
  expect(address.bare().toString()).toBe(JID);
});

test("client online with sasl2 and fast", async () => {
  expect.assertions(3);

  await server.disableModules(["saslauth"]);
  await server.enableModules([
    "sasl2",
    "sasl2_bind2",
    "sasl2_sm",
    "sasl2_fast",
  ]);
  await server.restart();

  xmpp = client({
    ...credentials,
    service: "ws://localhost:5280/xmpp-websocket",
  });

  // Get token
  await xmpp.start();
  await xmpp.stop();

  debug(xmpp);

  xmpp.on("nonza", (element) => {
    if (!element.is("features")) return;

    const authentication = element.getChild("authentication", NS_SASL2);
    if (!authentication) return;
    const inline = authentication.getChild("inline");
    expect(inline.getChild("fast", NS_FAST)).not.toBe(undefined);
  });

  xmpp.on("send", (el) => {
    const authenticate = el.is("authenticate", NS_SASL2);
    if (!authenticate) return;

    expect(el.attrs.mechanism).toBe("HT-SHA-256-NONE");
    expect(el.getChild("fast", NS_FAST)).not.toBe(undefined);
  });

  await xmpp.start();
});
