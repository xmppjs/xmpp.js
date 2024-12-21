import _reconnect from "./index.js";
import { EventEmitter } from "@xmpp/events";

test("it schedule a reconnect when disconnect is emitted", (done) => {
  const entity = new EventEmitter();
  const reconnect = _reconnect({ entity });

  reconnect.scheduleReconnect = () => {
    expect.pass();
    done();
  };

  entity.emit("disconnect");
});

test("#reconnect", async () => {
  expect.assertions(3);

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
