"use strict";

const _reconnect = require(".");
const EventEmitter = require("events");

test("it schedule a reconnect when disconnect is emitted", () => {
  expect.assertions(1);

  const entity = new EventEmitter();
  const reconnect = _reconnect({ entity });

  reconnect.scheduleReconnect = () => {
    expect.pass();
  };

  entity.emit("disconnect");
});

test("#reconnect", async () => {
  const entity = new EventEmitter();
  const reconnect = _reconnect({ entity });

  entity.options = {
    service: "service",
    lang: "lang",
    domain: "domain",
  };

  entity.connect = (service) => {
    expect(service).toBe(entity.options.service);
  };

  entity.open = ({ domain, lang }) => {
    expect(domain).toBe(entity.options.domain);
    expect(lang).toBe(entity.options.lang);
  };

  await reconnect.reconnect();
});
