import { EventEmitter } from "@xmpp/events";

import Connection from "../index.js";

test("calls _detachParser, sends a bad-format stream error and emit an error", async () => {
  expect.assertions(4);

  const conn = new Connection();
  const parser = new EventEmitter();
  conn._attachParser(parser);

  const spy_detachParser = jest.spyOn(conn, "_detachParser");
  const spy_streamError = jest.spyOn(conn, "_streamError");

  const error = new Error("foo");

  conn.on("error", (err) => {
    expect(err).toBe(error);
  });

  parser.emit("error", error);

  expect(spy_streamError).toHaveBeenCalledWith("bad-format");
  expect(spy_streamError).toHaveBeenCalledTimes(1);

  expect(spy_detachParser).toHaveBeenCalledTimes(1);
});
