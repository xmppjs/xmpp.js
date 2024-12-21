import fs from "fs";
import path from "path";

function readJSON(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const __dirname = import.meta.dirname;

// Makes xmpp.js package require and exports all other packages

const packages = fs
  .readdirSync(path.join(__dirname, ".."))
  // For some reason there's a * file on travis
  .filter((p) => !["*"].includes(p) && !p.includes("."))
  .map((name) => readJSON(path.join(__dirname, "..", name, "package.json")));

const xmppjsPackage = readJSON(path.join(__dirname, "package.json"));

// Write package.json dependencies
xmppjsPackage.dependencies = Object.fromEntries(
  packages.map((pkg) => {
    return [pkg.name, `^${pkg.version}`];
  }),
);

fs.writeFileSync(
  path.join(__dirname, "package.json"),
  JSON.stringify(xmppjsPackage, null, 2) + "\n",
);
