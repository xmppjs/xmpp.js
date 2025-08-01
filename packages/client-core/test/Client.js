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
