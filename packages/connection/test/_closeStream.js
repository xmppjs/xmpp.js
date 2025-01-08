import Connection from "../index.js";
import { EventEmitter, promise, timeout, TimeoutError } from "@xmpp/events";
import { xml } from "@xmpp/test";

test("resets properties on socket close event", () => {
  const conn = new Connection();
  conn._attachSocket(new EventEmitter());
  conn.status = "online";
  conn.socket.emit("connect");
  conn.socket.emit("close");
  expect(conn.status).toBe("disconnect");
});

test("timeout", async () => {
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

  await expect(conn._closeStream()).rejects.toThrow(new TimeoutError());
});

test("error on status closing", async () => {
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

  conn.parser.emit("end");

  await expect(conn._closeStream()).rejects.toThrow(
    new Error("Connection is closing"),
  );
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

  const promiseClose = conn._closeStream();
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
    conn._closeStream(),
  ]);

  conn.parser.emit("end");
  return p;
});

test("do not emit closing status if parser property is missing", async () => {
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

  await Promise.all([
    expect(timeout(promise(conn, "status"), 500)).rejects.toThrow(
      new TimeoutError(),
    ),
    expect(conn._closeStream()).rejects.toThrow(),
  ]);
});
