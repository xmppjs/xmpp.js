"use strict";

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

test("depends on all other packages", () => {
  expect(Object.keys(dependencies).length).toBe(Object.keys(packages).length);
  expect(dependencies).toEqual(packages);
});
