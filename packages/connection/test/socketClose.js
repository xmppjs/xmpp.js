import Connection from "../index.js";
import { EventEmitter } from "@xmpp/events";

test("calls _reset and _status", () => {
  expect.assertions(3);
  const conn = new Connection();
  const sock = new EventEmitter();
  conn._attachSocket(sock);

  const evt = {};
  conn._status = (status, { clean, event }) => {
    expect(clean).toBe(false);
    expect(event).toBe(evt);
  };

  const spy_reset = jest.spyOn(conn, "_reset");

  sock.emit("close", true, evt);

  expect(spy_reset).toHaveBeenCalled();
});
