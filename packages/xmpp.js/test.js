"use strict";

const test = require("ava");

const fs = require("fs");
const path = require("path");

const packages = Object.fromEntries(
  fs
    .readdirSync(path.join(__dirname, ".."))
    // For some reason there's a "*" file on travis
    .filter((p) => !["*"].includes(p) && !p.includes("."))
    .map((dirname) => {
      const { name, version } = require(path.join(
        __dirname,
        "..",
        dirname,
        "package.json",
      ));
      return [name, `^${version}`];
    }),
);

const { dependencies } = require("./package.json");

test("depends on all other packages", (t) => {
  t.is(Object.keys(dependencies).length, Object.keys(packages).length);
  t.deepEqual(dependencies, packages);
});
