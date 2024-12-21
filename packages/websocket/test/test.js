"use strict";

const ConnectionWebSocket = require("../lib/Connection");
const Socket = require("../lib/Socket");
const EventEmitter = require("events");
const xml = require("@xmpp/xml");

test("send() adds jabber:client xmlns", () => {
  const connection = new ConnectionWebSocket();
  connection.write = () => {};

  const element = xml("presence");

  expect(element.attrs.xmlns).toBe(undefined);
  connection.send(element);
  expect(element.attrs.xmlns).toBe("jabber:client");
});

test("socketParameters()", () => {
  let params;

  params = ConnectionWebSocket.prototype.socketParameters("ws://foo");
  expect(params).toBe("ws://foo");

  params = ConnectionWebSocket.prototype.socketParameters("wss://foo");
  expect(params).toBe("wss://foo");

  params = ConnectionWebSocket.prototype.socketParameters("http://foo");
  expect(params).toBe(undefined);
});

test("DOM WebSocket error", () => {
  const socket = new Socket();
  const sock = new EventEmitter();
  sock.addEventListener = sock.addListener;
  socket._attachSocket(sock);
  socket.url = "ws://foobar";
  const evt = {};
  socket.on("error", (err) => {
    expect(err.message).toBe("WebSocket ECONNERROR ws://foobar");
    expect(err.errno).toBe("ECONNERROR");
    expect(err.code).toBe("ECONNERROR");
    expect(err.url).toBe("ws://foobar");
    expect(err.event).toBe(evt);
  });
  socket.socket.emit("error", evt);
});

test("WS WebSocket error", () => {
  const socket = new Socket();
  const sock = new EventEmitter();
  sock.addEventListener = sock.addListener;
  socket._attachSocket(sock);
  socket.url = "ws://foobar";
  const error = {};
  const evt = { error };
  socket.on("error", (err) => {
    expect(err).toBe(error);
    expect(err.event).toBe(evt);
    expect(err.url).toBe("ws://foobar");
  });
  socket.socket.emit("error", evt);
});

test("socket close", () => {
  expect.assertions(3);
  const socket = new Socket();
  const spy_detachSocket = jest.spyOn(socket, "_detachSocket");

  const sock = new EventEmitter();
  sock.addEventListener = sock.addListener;
  sock.removeEventListener = sock.removeListener;
  socket._attachSocket(sock);
  const evt = { wasClean: false };
  socket.on("close", (clean, event) => {
    expect(clean).toBe(true);
    expect(evt).toBe(event);
    expect(spy_detachSocket).toHaveBeenCalled();
  });

  socket.socket.emit("close", evt);
});

test("sendMany", async () => {
  const conn = new ConnectionWebSocket();

  const foo = xml("foo");
  const bar = xml("bar");

  const spy_send = (conn.send = jest.fn());

  await conn.sendMany([foo, bar]);

  expect(spy_send).toHaveBeenCalledWith(foo);
  expect(spy_send).toHaveBeenCalledWith(bar);
  expect(spy_send).toHaveBeenCalledTimes(2);
});
