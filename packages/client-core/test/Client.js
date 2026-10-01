import { JID } from "@xmpp/test";

import Client from "../lib/Client.js";

test("_findTransport", () => {
  class Transport {
    socketParameters(uri) {
      if (uri === "a") {
        return uri;
      }

      if (uri === "b") {
        return undefined;
      }

      throw new Error("foobar");
    }
  }

  const entity = new Client();
  entity.transports.push(Transport);
  expect(entity._findTransport("a")).toBe(Transport);
  expect(entity._findTransport("b")).toBe(undefined);
  expect(entity._findTransport("c")).toBe(undefined);
});

test("header", () => {
  class Transport {
    header(el) {
      return el;
    }
  }

  const entity = new Client();
  entity.Transport = Transport;

  entity.jid = null;
  entity.isSecure = () => false;
  expect(entity.header(<foo />)).toEqual(<foo />);

  entity.jid = null;
  entity.isSecure = () => true;
  expect(entity.header(<foo />)).toEqual(<foo />);

  entity.jid = new JID("foo@bar/example");
  entity.isSecure = () => false;
  expect(entity.header(<foo />)).toEqual(<foo />);

  entity.jid = new JID("foo@bar/example");
  entity.isSecure = () => true;
  expect(entity.header(<foo />)).toEqual(<foo from="foo@bar" />);
});

test("socketParameters sets the TLS SNI to the JID domain", () => {
  class Transport {}
  Transport.prototype.socketParameters = () => ({
    port: 5223,
    host: "203.0.113.1",
  });

  const entity = new Client({ domain: "example.org" });
  entity.Transport = Transport;

  expect(entity.socketParameters("xmpps://203.0.113.1:5223")).toEqual({
    port: 5223,
    host: "203.0.113.1",
    servername: "example.org",
  });
});

test("socketParameters leaves non-object (websocket) params untouched", () => {
  class Transport {}
  Transport.prototype.socketParameters = () => "wss://example.org/ws";

  const entity = new Client({ domain: "example.org" });
  entity.Transport = Transport;

  expect(entity.socketParameters("wss://example.org/ws")).toBe(
    "wss://example.org/ws",
  );
});
