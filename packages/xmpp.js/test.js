import fs from "fs";
import path from "path";

function readJSON(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const packages = Object.fromEntries(
  fs
    .readdirSync(path.join(__dirname, ".."))
    // For some reason there's a "*" file on travis
    .filter((p) => !["*"].includes(p) && !p.includes("."))
    .map((dirname) => {
      const { name, version } = readJSON(
        path.join(__dirname, "..", dirname, "package.json"),
      );
      return [name, `^${version}`];
    }),
);

const { dependencies } = readJSON(path.join(__dirname, "package.json"));

test("depends on all other packages", () => {
  expect(Object.keys(dependencies)).toHaveLength(Object.keys(packages).length);
  expect(dependencies).toEqual(packages);
});
