"use strict";

const test = require("ava");
const Connection = require("..");

test("rejects if connection is not offline", (t) => {
  const conn = new Connection();
  conn.status = "online";
  return conn.start().catch((err) => {
    t.true(err instanceof Error);
    t.is(err.message, "Connection is not offline");
  });
});
