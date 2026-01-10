import { EventEmitter } from "@xmpp/events";
import { mockSocket } from "@xmpp/test";

import Connection from "../index.js";

class MockParser extends EventEmitter {}

test("open() sets xml:lang attribute when lang option is provided", async () => {
  const conn = new Connection({ domain: "example.com", lang: "en" });
  conn.Parser = MockParser;
  conn.socket = mockSocket();

  // Emit 'open' event after a small delay to let open() set up
  setTimeout(() => conn.emit("open"), 10);

  await conn.open({ domain: "example.com", lang: "en" });

  expect(conn.root.attrs["xml:lang"]).toBe("en");
  expect(conn.root.attrs.to).toBe("example.com");
});

test("open() omits xml:lang attribute when lang option is undefined", async () => {
  const conn = new Connection({ domain: "example.com" });
  conn.Parser = MockParser;
  conn.socket = mockSocket();

  setTimeout(() => conn.emit("open"), 10);

  await conn.open({ domain: "example.com", lang: undefined });

  // The xml:lang attribute should be undefined (will be omitted in XML output)
  expect(conn.root.attrs["xml:lang"]).toBe(undefined);
  expect(conn.root.attrs.to).toBe("example.com");
});

test("start() passes lang option to open()", async () => {
  const conn = new Connection({
    service: "xmpp://localhost:5222",
    domain: "example.com",
    lang: "fr",
  });
  conn.Parser = MockParser;

  // Mock connect to succeed immediately
  conn.connect = async () => {
    conn.socket = mockSocket();
    conn._status("connect");
  };

  // Emit events after start() sets up listeners
  setTimeout(() => {
    conn.emit("open");
    conn.emit("online");
  }, 10);

  await conn.start();

  expect(conn.root.attrs["xml:lang"]).toBe("fr");
});

test("restart() passes lang option to open()", async () => {
  const conn = new Connection({
    domain: "example.com",
    lang: "de",
  });
  conn.Parser = MockParser;
  conn.socket = mockSocket();

  setTimeout(() => conn.emit("open"), 10);

  await conn.restart();

  expect(conn.root.attrs["xml:lang"]).toBe("de");
});
