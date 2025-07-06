import xml from "@xmpp/xml";

import Connection from "../index.js";

test("#_streamError", async () => {
  const conn = new Connection();

  const spy_disconnect = jest.spyOn(conn, "disconnect");
  const spy_send = jest.spyOn(conn, "send");

  await conn._streamError("foo-bar");

  expect(spy_disconnect).toHaveBeenCalled();

  expect(spy_send).toHaveBeenCalledWith(
    xml("stream:error", {}, [
      xml("foo-bar", { xmlns: "urn:ietf:params:xml:ns:xmpp-streams" }),
    ]),
  );
});
