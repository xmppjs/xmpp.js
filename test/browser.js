"use strict";

const { JSDOM } = require("jsdom");
const fetch = require("node-fetch");
const { readFileSync } = require("fs");

const { jid } = require("../packages/client");
const debug = require("../packages/debug");
const server = require("../server");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const username = "client";
const password = "foobar";
const credentials = { username, password };
const domain = "localhost";
const JID = jid(username, domain).toString();
const service = "ws://localhost:5280/xmpp-websocket";

const xmppjs = readFileSync("./packages/client/dist/xmpp.js", {
  encoding: "utf8",
});

beforeEach(() => {
  const { window } = new JSDOM(``, { runScripts: "dangerously" });
  window.fetch = fetch;
  const { document } = window;
  const scriptEl = document.createElement("script");
  scriptEl.textContent = xmppjs;
  document.body.append(scriptEl);
  t.context = window.XMPP.client;
  return server.restart();
});

test("client ws://", async () => {
  const xmpp = t.context({
    credentials,
    service,
  });
  debug(xmpp);

  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});
