import { EventEmitter } from "node:events";

import { fallbackConnect } from "../index.js";

function makeTransport(params) {
  const calls = [];
  class Socket extends EventEmitter {
    connect(value) {
      calls.push(value);
      queueMicrotask(() => this.emit("connect"));
    }
  }
  class Transport {}
  Transport.prototype.socketParameters = () => params;
  Transport.prototype.Socket = Socket;
  return { Transport, calls };
}

function makeEntity(Transport, options) {
  return {
    options,
    _findTransport: () => Transport,
    _status: () => {},
    _attachSocket: () => {},
  };
}

test("sets the TLS SNI to the JID domain for object params", async () => {
  const { Transport, calls } = makeTransport({
    port: 5223,
    host: "203.0.113.1",
  });
  const entity = makeEntity(Transport, { domain: "example.org" });

  await fallbackConnect(entity, ["xmpps://203.0.113.1:5223"]);

  expect(calls).toEqual([
    { port: 5223, host: "203.0.113.1", servername: "example.org" },
  ]);
});

test("leaves non-object (websocket) params untouched", async () => {
  const { Transport, calls } = makeTransport("wss://example.org/ws");
  const entity = makeEntity(Transport, { domain: "example.org" });

  await fallbackConnect(entity, ["wss://example.org/ws"]);

  expect(calls).toEqual(["wss://example.org/ws"]);
});

test("does not set a servername when there is no domain", async () => {
  const { Transport, calls } = makeTransport({
    port: 5222,
    host: "203.0.113.1",
  });
  const entity = makeEntity(Transport, {});

  await fallbackConnect(entity, ["xmpp://203.0.113.1:5222"]);

  expect(calls).toEqual([{ port: 5222, host: "203.0.113.1" }]);
});
