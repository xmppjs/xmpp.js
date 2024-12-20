"use strict";

const Client = require("../lib/Client");

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
