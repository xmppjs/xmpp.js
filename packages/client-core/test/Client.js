"use strict";

const test = require("ava");
const Client = require("../lib/Client");

test("_findTransport", (t) => {
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
  t.is(entity._findTransport("a"), Transport);
  t.is(entity._findTransport("b"), undefined);
  t.is(entity._findTransport("c"), undefined);
});
