import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";
import child_process from "node:child_process";

import { isPortOpen, promisePortOpen, promisePortClose } from "promise-port";

import { makeSelfSignedCertificate } from "../test/helpers.js";

const __dirname = "./server";
// const __dirname = import.meta.dirname;

const exec = promisify(child_process.exec);

const DATA_PATH = path.join(__dirname);
const PID_PATH = path.join(DATA_PATH, "prosody.pid");
const PROSODY_PORT = 5347;
const CFG_PATH = path.join(__dirname, "prosody.cfg.lua");

async function clean() {
  try {
    await Promise.all(
      ["prosody.err", "prosody.log", "prosody.pid"].map((file) =>
        fs.unlink(path.join(__dirname, file)),
      ),
    );
  } catch {}
}

async function makeCertificate() {
  const pem = await makeSelfSignedCertificate();
  await Promise.all([
    fs.writeFile(path.join(__dirname, "certs/localhost.crt"), pem.cert),
    fs.writeFile(path.join(__dirname, "certs/localhost.key"), pem.private),
  ]);
}

async function kill(signal = "SIGTERM") {
  const pid = await getPid();
  try {
    process.kill(pid, signal);
  } catch (err) {
    if (err.code !== "ESRCH") throw err;
  }
}

async function getPid() {
  try {
    return await fs.readFile(PID_PATH, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    return "";
  }
}

async function _start() {
  const opening = promisePortOpen(PROSODY_PORT);

  makeCertificate();

  await exec("prosody -D", {
    cwd: DATA_PATH,
    env: {
      ...process.env,
      PROSODY_CONFIG: "prosody.cfg.lua",
    },
  });

  return opening;
}

async function start() {
  if (await isPortOpen(PROSODY_PORT)) return;
  await clean();
  return _start();
}

async function stop(signal) {
  if (!(await isPortOpen(PROSODY_PORT))) {
    return clean();
  }

  const closing = promisePortClose(PROSODY_PORT);
  await kill(signal);
  return closing;
}

async function restart(signal) {
  await stop(signal);
  return _start();
}

async function enableModules(mods) {
  if (!Array.isArray(mods)) {
    mods = [mods];
  }

  let prosody_cfg = await fs.readFile(CFG_PATH, "utf8");
  for (const mod of mods) {
    prosody_cfg = prosody_cfg.replace(`\n  -- "${mod}";`, `\n  "${mod}";`);
  }
  await fs.writeFile(CFG_PATH, prosody_cfg);
}

async function disableModules(mods) {
  if (!Array.isArray(mods)) {
    mods = [mods];
  }

  let prosody_cfg = await fs.readFile(CFG_PATH, "utf8");
  for (const mod of mods) {
    prosody_cfg = prosody_cfg.replace(`\n  "${mod}";`, `\n  -- "${mod}";`);
  }
  await fs.writeFile(CFG_PATH, prosody_cfg);
}

async function reset() {
  await exec("git checkout server/prosody.cfg.lua");
}

export default {
  getPid,
  start,
  stop,
  restart,
  kill,
  enableModules,
  disableModules,
  reset,
};
