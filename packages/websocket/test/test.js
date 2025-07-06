import { EventEmitter } from "@xmpp/events";
import xml from "@xmpp/xml";

import ConnectionWebSocket from "../lib/Connection.js";
import Socket from "../lib/Socket.js";

test("send()", () => {
  const connection = new ConnectionWebSocket();
  connection.write = () => {};
  connection.root = xml("root");

  const element = xml("presence");

  expect(element.attrs.xmlns).toBe(undefined);
  expect(element.parent).toBe(null);
  connection.send(element);
  expect(element.attrs.xmlns).toBe("jabber:client");
  expect(element.parent).toBe(connection.root);
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

test("WebSocket error", () => {
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
  conn.socket = new Socket();
  const spy_write = jest.spyOn(conn.socket, "write");
  conn.root = xml("root");

  const foo = xml("presence");
  const bar = xml("presence");
  const elements = [foo, bar];

  for (const element of elements) {
    expect(element.attrs.xmlns).toBe(undefined);
    expect(element.parent).toBe(null);
  }

  conn.sendMany(elements);

  for (const element of elements) {
    expect(element.attrs.xmlns).toBe("jabber:client");
    expect(element.parent).toBe(conn.root);
  }

  expect(spy_write).toHaveBeenCalledWith(foo.toString());
  expect(spy_write).toHaveBeenCalledWith(bar.toString());
  expect(spy_write).toHaveBeenCalledTimes(2);
});
