"use strict";

const test = require("ava");
const JID = require("../lib/JID");

test("throws TypeError for invalid domain", (t) => {
  t.throws(() => new JID("foo"), { instanceOf: TypeError });

  t.throws(() => new JID(), { instanceOf: TypeError });

  t.throws(() => new JID("foo", "", "r"), { instanceOf: TypeError });

  t.throws(() => new JID("foo", "", "r"), { instanceOf: TypeError });
});
