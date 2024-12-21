import { jid } from "../packages/client/index.js";
import debug from "../packages/debug/index.js";
import server from "../server/index.js";

import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { readFileSync } from "fs";

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
