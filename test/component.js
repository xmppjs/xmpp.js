"use strict";

const { component, xml, jid } = require("../packages/component");
const debug = require("../packages/debug");
const server = require("../server");

const password = "mysecretcomponentpassword";
const service = "xmpp://localhost:5347";
const domain = "component.localhost";
const options = { password, service, domain };

beforeEach(() => {
  return server.restart();
});

afterEach(() => {
  if (t.context.xmpp) {
    return t.context.xmpp.stop();
  }
});

test("component", async () => {
  expect.assertions(6);

  const xmpp = component(options);
  t.context.xmpp = xmpp;
  debug(xmpp);

  xmpp.on("connect", () => {});

  xmpp.on("open", (el) => {
    expect(el instanceof xml.Element).toBe(true);
  });

  xmpp.on("online", (id) => {
    expect(id instanceof jid.JID).toBe(true);
    expect(id.toString()).toBe("component.localhost");
  });

  const id = await xmpp.start();

  expect(id instanceof jid.JID).toBe(true);
  expect(id.toString()).toBe("component.localhost");
  await xmpp.stop;
});

test("reconnects when server restarts", done => {
  expect.assertions(2);
  let c = 0;

  const xmpp = component(options);
  debug(xmpp);

  xmpp.on("error", () => {});

  xmpp.on("online", async () => {
    c++;
    if (c === 2) {
      await xmpp.stop();
      done();
    } else {
      server.restart();
    }
  });

  xmpp.start();

  t.context.xmpp = xmpp;
});

test("does not reconnect when stop is called", done => {
  expect.assertions(2);

  const xmpp = component(options);
  debug(xmpp);

  xmpp.on("online", async () => {
    await xmpp.stop();
    await server.stop();
    done();
  });

  xmpp.on("close", () => );

  xmpp.on("offline", () => );

  xmpp.start();

  t.context.xmpp = xmpp;
});
