"use strict";

const test = require("ava");
const Connection = require("..");
const { EventEmitter, promise, timeout } = require("@xmpp/events");
const xml = require("@xmpp/xml");

test("resets properties on socket close event", (t) => {
  const conn = new Connection();
  conn._attachSocket(new EventEmitter());
  conn.jid = {};
  conn.status = "online";
  conn.socket.emit("connect");
  conn.socket.emit("close");
  t.is(conn.jid, null);
  t.is(conn.status, "disconnect");
});

test.cb("timeout", (t) => {
  t.plan(2);
  const conn = new Connection();
  conn.parser = new EventEmitter();
  conn.footerElement = () => {
    return xml("hello");
  };

  conn.socket = new EventEmitter();
  conn.socket.write = (data, cb) => {
    return cb();
  };

  conn.on("output", (el) => {
    t.is(el, "<hello/>");
  });
  conn.close().catch((err) => {
    t.is(err.name, "TimeoutError");
    t.end();
  });
});

test.cb("error on status closing", (t) => {
  t.plan(2);
  const conn = new Connection();
  conn.parser = new EventEmitter();
  conn.footerElement = () => {
    return xml("hello");
  };

  conn.socket = new EventEmitter();
  conn.socket.write = (data, cb) => {
    return cb();
  };

  conn.status = "closing";
  conn.close().catch((err) => {
    t.is(err.name, "Error");
    t.is(err.message, "Connection is closing");
    t.end();
  });
  conn.parser.emit("end");
});

test("resolves", async (t) => {
  t.plan(2);
  const conn = new Connection();
  conn.parser = new EventEmitter();
  conn.footerElement = () => {
    return xml("hello");
  };

  conn.socket = new EventEmitter();
  conn.socket.write = (data, cb) => {
    return cb();
  };

  conn.on("output", (el) => {
    t.is(el, "<hello/>");
  });

  const promiseClose = conn.close();
  conn.parser.emit("end", xml("goodbye"));

  const el = await promiseClose;

  t.is(el.toString(), `<goodbye/>`);
});

test("emits closing status", (t) => {
  const conn = new Connection();
  conn.parser = new EventEmitter();
  conn.footerElement = () => {
    return xml("hello");
  };

  conn.socket = new EventEmitter();
  conn.socket.write = (data, cb) => {
    return cb();
  };

  const p = Promise.all([
    promise(conn, "status").then((status) => t.is(status, "closing")),
    conn.close(),
  ]);

  conn.parser.emit("end");
  return p;
});

test("do not emit closing status if parser property is missing", (t) => {
  t.plan(2);
  const conn = new Connection();
  conn.parser = null;
  conn.footerElement = () => {
    return xml("hello");
  };

  conn.socket = new EventEmitter();
  conn.socket.write = (data, cb) => {
    return cb();
  };

  return Promise.all([
    timeout(promise(conn, "status"), 500).catch((err) =>
      t.is(err.name, "TimeoutError"),
    ),
    conn.close().catch((err) => t.pass(err)),
  ]);
});
