"use strict";

const Connection = require("..");
const xml = require("@xmpp/xml");

test("#_streamError", async () => {
  const conn = new Connection();

  const spy_end = jest.spyOn(conn, "_end");
  const spy_send = jest.spyOn(conn, "send");

  await conn._streamError("foo-bar");

  expect(spy_end).toHaveBeenCalled();

  expect(spy_send).toHaveBeenCalledWith(
    xml("stream:error", {}, [
      xml("foo-bar", { xmlns: "urn:ietf:params:xml:ns:xmpp-streams" }),
    ]),
  );
});
