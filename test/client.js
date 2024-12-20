"use strict";

const { client, xml, jid } = require("../packages/client");
const debug = require("../packages/debug");
const server = require("../server");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const username = "client";
const password = "foobar";
const credentials = { username, password };
const domain = "localhost";
const JID = jid(username, domain).toString();

let xmpp;

beforeEach(async () => {
  await server.restart();
});

afterEach(async () => {
  await xmpp?.stop();
});

test("client", async () => {
  expect.assertions(6);

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  xmpp.on("connect", () => {
    expect().pass();
  });

  xmpp.once("open", (el) => {
    expect(el instanceof xml.Element).toBe(true);
  });

  xmpp.on("online", (address) => {
    expect(address instanceof jid.JID).toBe(true);
    expect(address.bare().toString()).toBe(JID);
  });

  const address = await xmpp.start();
  expect(address instanceof jid.JID).toBe(true);
  expect(address.bare().toString()).toBe(JID);
});

test("bad credentials", (done) => {
  expect.assertions(6);

  xmpp = client({
    service: domain,
    credentials: { ...credentials, password: "nope" },
  });
  debug(xmpp);

  let error;

  xmpp.on("connect", () => {
    expect().pass();
  });
  xmpp.once("open", () => {
    expect().pass();
  });

  xmpp.on("online", () => done.fail());

  xmpp.on("error", (err) => {
    expect(err instanceof Error).toBe(true);
    expect(err.name).toBe("SASLError");
    expect(err.condition).toBe("not-authorized");
    error = err;
  });

  xmpp
    .start()
    .then(() => done.fail())
    .catch((err) => {
      expect(err).toBe(error);
      done();
    });
});

test("reconnects when server restarts gracefully", (done) => {
  expect.assertions(2);
  let c = 0;

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  xmpp.on("error", () => {});

  xmpp.on("online", async () => {
    c++;
    expect().pass();
    if (c === 2) {
      await xmpp.stop();
      done();
    } else {
      await server.restart();
    }
  });

  xmpp.start();
});

test("reconnects when server restarts non-gracefully", (done) => {
  expect.assertions(2);
  let c = 0;

  xmpp = client({ credentials, service: domain });
  debug(xmpp);

  xmpp.on("error", () => {});

  xmpp.on("online", async () => {
    c++;
    expect().pass();
    if (c === 2) {
      await xmpp.stop();
      done();
    } else {
      await server.restart("SIGKILL");
    }
  });

  xmpp.start();
});

test("does not reconnect when stop is called", (done) => {
  expect.assertions(2);

  xmpp = client({ service: domain, credentials });
  debug(xmpp);

  xmpp.on("online", async () => {
    await xmpp.stop();
    server.stop();
    done();
  });

  xmpp.on("close", () => {
    expect().pass();
  });

  xmpp.on("offline", () => {
    expect().pass();
  });

  xmpp.start();
});

test("anonymous authentication", (done) => {
  expect.assertions(2);

  xmpp = client({ service: domain, domain: "anon." + domain });
  debug(xmpp);

  xmpp.on("online", async () => {
    await xmpp.stop();
    await server.stop();
    done();
  });

  xmpp.on("close", () => {
    expect().pass();
  });

  xmpp.on("offline", () => {
    expect().pass();
  });

  xmpp.start();
});

test("auto", async () => {
  xmpp = client({ credentials, service: domain });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("ws IPv4", async () => {
  xmpp = client({
    credentials,
    service: "ws://127.0.0.1:5280/xmpp-websocket",
    domain,
  });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("ws IPv6", async () => {
  xmpp = client({
    credentials,
    service: "ws://[::1]:5280/xmpp-websocket",
    domain,
  });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("ws domain", async () => {
  xmpp = client({
    credentials,
    service: "ws://localhost:5280/xmpp-websocket",
  });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

// Prosody 404 https://prosody.im/issues/issue/932
test("wss IPv4", async () => {
  xmpp = client({
    credentials,
    service: "wss://127.0.0.1:5281/xmpp-websocket",
    domain,
  });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

// Prosody 404 https://prosody.im/issues/issue/932
test("wss IPv6", async () => {
  xmpp = client({
    credentials,
    service: "wss://[::1]:5281/xmpp-websocket",
    domain,
  });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("wss domain", async () => {
  xmpp = client({
    credentials,
    service: "wss://localhost:5281/xmpp-websocket",
  });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("xmpp IPv4", async () => {
  xmpp = client({
    credentials,
    service: "xmpp://127.0.0.1:5222",
    domain,
  });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("xmpp IPv6", async () => {
  xmpp = client({ credentials, service: "xmpp://[::1]:5222", domain });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("xmpp domain", async () => {
  xmpp = client({ credentials, service: "xmpp://localhost:5222" });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("xmpps IPv4", async () => {
  xmpp = client({
    credentials,
    service: "xmpps://127.0.0.1:5223",
    domain,
  });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("xmpps IPv6", async () => {
  xmpp = client({ credentials, service: "xmpps://[::1]:5223", domain });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});

test("xmpps domain", async () => {
  xmpp = client({ credentials, service: "xmpps://localhost:5223" });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});
