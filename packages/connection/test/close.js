"use strict";

const Connection = require("..");
const { EventEmitter, promise, timeout } = require("@xmpp/events");
const xml = require("@xmpp/xml");

test("resets properties on socket close event", () => {
  const conn = new Connection();
  conn._attachSocket(new EventEmitter());
  conn.jid = {};
  conn.status = "online";
  conn.socket.emit("connect");
  conn.socket.emit("close");
  expect(conn.jid).toBe(null);
  expect(conn.status).toBe("disconnect");
});

test("timeout", (done) => {
  expect.assertions(2);
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
    expect(el).toBe("<hello/>");
  });
  conn.close().catch((err) => {
    expect(err.name).toBe("TimeoutError");
    done();
  });
});

test("error on status closing", (done) => {
  expect.assertions(2);
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
    expect(err.name).toBe("Error");
    expect(err.message).toBe("Connection is closing");
    done();
  });
  conn.parser.emit("end");
});

test("resolves", async () => {
  expect.assertions(2);
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
    expect(el).toBe("<hello/>");
  });

  const promiseClose = conn.close();
  conn.parser.emit("end", xml("goodbye"));

  const el = await promiseClose;

  expect(el.toString()).toBe(`<goodbye/>`);
});

test("emits closing status", () => {
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
    promise(conn, "status").then((status) => expect(status).toBe("closing")),
    conn.close(),
  ]);

  conn.parser.emit("end");
  return p;
});

test("do not emit closing status if parser property is missing", () => {
  expect.assertions(2);
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
      expect(err.name).toBe("TimeoutError"),
    ),
    conn.close().catch((err) => {
      expect(err).toBeInstanceOf(Error);
    }),
  ]);
});
