"use strict";

const test = require("ava");
const Connection = require("..");

test("#_onData", (t) => {
  t.plan(2);
  const foo = "<foo>";
  const conn = new Connection();
  conn.parser = {
    write(str) {
      t.is(str, foo);
    },
  };

  conn.on("input", (data) => {
    t.is(data, foo);
  });
  conn._onData(foo);
});
