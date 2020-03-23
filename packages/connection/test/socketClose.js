"use strict";

const test = require("ava");
const Connection = require("..");
const { EventEmitter } = require("@xmpp/events");

test("calls _reset and _status", (t) => {
  t.plan(3);
  const conn = new Connection();
  const sock = new EventEmitter();
  conn._attachSocket(sock);

  const evt = {};
  conn._status = (status, { clean, event }) => {
    t.is(clean, false);
    t.is(event, evt);
  };

  conn._reset = () => {
    t.pass();
  };

  sock.emit("close", true, evt);
});
