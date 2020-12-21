"use strict";

const test = require("ava");
const Connection = require("..");
const { EventEmitter } = require("@xmpp/events");
const xml = require("@xmpp/xml");

test("new Connection()", (t) => {
  const conn = new Connection();
  t.is(conn.jid, null);
  t.is(conn.timeout, 2000);
  t.true(conn instanceof EventEmitter);
});

test("isStanza()", (t) => {
  const conn = new Connection();

  t.is(conn.isStanza(xml("foo")), false);

  t.is(conn.isStanza(xml("presence")), true);
  t.is(conn.isStanza(xml("iq")), true);
  t.is(conn.isStanza(xml("message")), true);
});

test("isNonza()", (t) => {
  const conn = new Connection();

  t.is(conn.isNonza(xml("foo")), true);

  t.is(conn.isNonza(xml("presence")), false);
  t.is(conn.isNonza(xml("iq")), false);
  t.is(conn.isNonza(xml("message")), false);
});
