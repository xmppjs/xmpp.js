import ConnectionTCP from "./lib/Connection.js";

test("socketParameters()", () => {
  let params;

  params = ConnectionTCP.prototype.socketParameters("xmpp://foo");
  expect(params.port).toBe(5222);

  params = ConnectionTCP.prototype.socketParameters("xmpp://foo:1234");
  expect(params.port).toBe(1234);

  params = ConnectionTCP.prototype.socketParameters("xmpps://foo:1234");
  expect(params).toBe(undefined);
});
