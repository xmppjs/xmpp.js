import Connection from "../index.js";
import { EventEmitter } from "@xmpp/events";

test("emit error on socket error", () => {
  const conn = new Connection();
  conn._attachSocket(new EventEmitter());
  const error = new Error("foobar");
  conn.on("error", (err) => {
    expect(err).toBe(error);
  });
  conn.socket.emit("error", error);
});
