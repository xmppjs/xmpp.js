"use strict";

const { JSDOM } = require("jsdom");
const fetch = require("node-fetch");
const { readFileSync } = require("fs");

const { jid } = require("../packages/client");
const debug = require("../packages/debug");
const server = require("../server");

const username = "client";
const password = "foobar";
const credentials = { username, password };
const domain = "localhost";
const JID = jid(username, domain).toString();
const service = "ws://localhost:5280/xmpp-websocket";

const xmppjs = readFileSync("./packages/client/dist/xmpp.js", {
  encoding: "utf8",
});

let window;
let xmpp;

beforeEach(async () => {
  ({ window } = new JSDOM(``, { runScripts: "dangerously" }));
  window.fetch = fetch;
  const { document } = window;
  const scriptEl = document.createElement("script");
  scriptEl.textContent = xmppjs;
  document.body.append(scriptEl);
  await server.restart();
});

afterEach(async () => {
  await xmpp?.stop();
});

test("client ws://", async () => {
  xmpp = window.XMPP.client({
    credentials,
    service,
  });
  debug(xmpp);

  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});
