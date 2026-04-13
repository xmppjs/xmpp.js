import Connection from "@xmpp/connection";
import resolve from "@xmpp/resolve";

import _reconnect from "../index.js";

test("schedules a reconnect when disconnect is emitted", () => {
  const entity = new Connection();
  const reconnect = _reconnect({ entity });
  const spy_scheduleReconnect = jest.spyOn(reconnect, "scheduleReconnect");

  expect(spy_scheduleReconnect).toHaveBeenCalledTimes(0);
  entity.emit("disconnect");
  expect(spy_scheduleReconnect).toHaveBeenCalledTimes(1);
});

test("reconnect repeats on resolve fail", async () => {
  jest.useFakeTimers();
  const entity = new Connection();
  entity.status = "disconnect";
  entity.options.service = "xmpp.example.com";
  resolve({ entity });
  const reconnect = _reconnect({ entity });
  const spy_scheduleReconnect = jest.spyOn(reconnect, "scheduleReconnect");

  expect(spy_scheduleReconnect).toHaveBeenCalledTimes(0);
  entity.emit("disconnect");
  await jest.runOnlyPendingTimersAsync();
  await jest.runOnlyPendingTimersAsync();
  await jest.runOnlyPendingTimersAsync();
  expect(spy_scheduleReconnect).toHaveBeenCalledTimes(2);
});

test("#reconnect", async () => {
  const service = "service";
  const lang = "lang";
  const domain = "domain";

  const entity = new Connection({
    service,
    lang,
    domain,
  });
  const reconnect = _reconnect({ entity });

  const spy_connect = jest.spyOn(entity, "connect").mockResolvedValue();
  const spy_open = jest.spyOn(entity, "open").mockResolvedValue();

  await reconnect.reconnect();

  expect(spy_connect).toHaveBeenCalledWith(service);
  expect(spy_open).toHaveBeenCalledWith({
    domain,
    lang,
  });
});
