"use strict";

const Connection = require("..");
const { EventEmitter } = require("@xmpp/events");
const xml = require("@xmpp/xml");

test("new Connection()", () => {
  const conn = new Connection();
  expect(conn.jid).toBe(null);
  expect(conn.timeout).toBe(2000);
  expect(conn instanceof EventEmitter).toBe(true);
});

test("isStanza()", () => {
  const conn = new Connection();

  expect(conn.isStanza(xml("foo"))).toBe(false);

  expect(conn.isStanza(xml("presence"))).toBe(true);
  expect(conn.isStanza(xml("iq"))).toBe(true);
  expect(conn.isStanza(xml("message"))).toBe(true);
});

test("isNonza()", () => {
  const conn = new Connection();

  expect(conn.isNonza(xml("foo"))).toBe(true);

  expect(conn.isNonza(xml("presence"))).toBe(false);
  expect(conn.isNonza(xml("iq"))).toBe(false);
  expect(conn.isNonza(xml("message"))).toBe(false);
});
