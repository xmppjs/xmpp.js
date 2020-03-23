"use strict";

const test = require("ava");
const xml = require("..");
const clone = require("../lib/clone");

test("adopts parent namespace", (t) => {
  const el = xml("foo", { xmlns: "bar" }, xml("bar"));

  t.deepEqual(clone(el.getChild("bar")), xml("bar", { xmlns: "bar" }));
});
