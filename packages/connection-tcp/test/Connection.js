import _Connection from "@xmpp/connection";
import xml from "@xmpp/xml";

import Connection from "../index.js";
import Socket from "../Socket.js";


const NS_STREAM = "http://etherx.jabber.org/streams";

test("new Connection()", () => {
  const conn = new Connection();
  expect(conn instanceof _Connection).toBe(true);
  expect(conn.NS).toBe(NS_STREAM);
});

test("Socket", () => {
  const conn = new Connection();
  expect(conn.Socket).toBe(Socket);
});

test("NS", () => {
  expect(Connection.prototype.NS).toBe(NS_STREAM);
});

test("header()", () => {
  const conn = new Connection();
  conn.NS = "foobar";
  expect(conn.header(conn.headerElement())).toBe(
    `<?xml version='1.0'?><stream:stream version="1.0" xmlns="foobar" xmlns:stream="${NS_STREAM}">`,
  );
});

test("footer()", () => {
  const conn = new Connection();
  expect(conn.footer()).toBe("</stream:stream>");
});

test("socketParameters()", () => {
  expect(Connection.prototype.socketParameters("xmpp://foo")).toEqual({
    port: null,
    host: "foo",
  });

  expect(Connection.prototype.socketParameters("xmpp://foo:1234")).toEqual({
    port: 1234,
    host: "foo",
  });

  expect(Connection.prototype.socketParameters("xmpps://foo:1234")).toEqual(
    undefined,
  );
});

test("sendMany", async () => {
  expect.assertions(1);
  const conn = new Connection();
  conn.root = xml("root");

  const foo = xml("foo");
  const bar = xml("bar");

  conn.socket = {
    write(str, fn) {
      expect(str).toBe("<foo/><bar/>");
      fn();
    },
  };

  await conn.sendMany([foo, bar]);
});
