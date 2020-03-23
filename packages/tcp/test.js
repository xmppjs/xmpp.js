"use strict";

const test = require("ava");
const ConnectionTCP = require("./lib/Connection");

test("socketParameters()", (t) => {
  let params;

  params = ConnectionTCP.prototype.socketParameters("xmpp://foo");
  t.is(params.port, 5222);

  params = ConnectionTCP.prototype.socketParameters("xmpp://foo:1234");
  t.is(params.port, 1234);

  params = ConnectionTCP.prototype.socketParameters("xmpps://foo:1234");
  t.is(params, undefined);
});
