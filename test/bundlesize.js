/* eslint-disable no-console, unicorn/no-process-exit, n/no-process-exit */

import zlib from "node:zlib";
import { readFile } from "node:fs/promises";
import bytes from "bytes";

import { promisify } from "node:util";

const brotliCompress = promisify(zlib.brotliCompress);

const path = "packages/client/dist/xmpp.min.js";
const buffer = await readFile(path);
const compressed = await brotliCompress(buffer);

const max_size = "15 KB";

console.log(`${path}:`);
if (compressed.length > bytes(max_size)) {
  console.log(
    "\u001B[31m%s\u001B[0m",
    `${bytes(compressed.length)} > ${max_size} ❌`,
  );
  process.exit(1);
} else {
  console.log(
    "\u001B[32m%s\u001B[0m",
    `${bytes(compressed.length)} < ${max_size} ✅`,
  );
  process.exit(0);
}
