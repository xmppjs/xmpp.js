"use strict";

const { client, jid } = require("../packages/client");
const debug = require("../packages/debug");
const server = require("../server");

const username = "client";
const password = "foobar";
const credentials = { username, password };
const domain = "localhost";
const JID = jid(username, domain).toString();

let xmpp;

beforeEach(() => {
  return server.restart();
});

afterEach(async () => {
  await xmpp?.stop();
});

test("see-other-host", async () => {
  const net = require("net");
  const Connection = require("../packages/connection-tcp");
  const { promise } = require("../packages/events");

  const seeOtherHostServer = net.createServer((socket) => {
    const conn = new Connection();
    conn._attachSocket(socket);
    const parser = new conn.Parser();
    conn._attachParser(parser);
    parser.on("start", () => {
      const openEl = conn.headerElement();
      openEl.attrs.from = "localhost";
      conn.write(conn.header(openEl));
      conn._streamError("see-other-host", "localhost:5222");
    });
    socket.on("close", () => {
      seeOtherHostServer.close();
    });
  });
  seeOtherHostServer.listen(5486);
  await promise(seeOtherHostServer, "listening");

  xmpp = client({ credentials, service: "xmpp://localhost:5486" });
  debug(xmpp);
  const address = await xmpp.start();
  expect(address.bare().toString()).toBe(JID);
});
