import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";
import child_process from "node:child_process";
import net from "node:net";

// eslint-disable-next-line n/no-extraneous-import
import { promise, delay } from "@xmpp/events";
import selfsigned from "selfsigned";

const __dirname = "./server";
// const __dirname = import.meta.dirname;

const exec = promisify(child_process.exec);

const DATA_PATH = path.join(__dirname);
const PID_PATH = path.join(DATA_PATH, "prosody.pid");
const PROSODY_PORT = 5347;
const CFG_PATH = path.join(__dirname, "prosody.cfg.lua");

function clean() {
  return Promise.all(
    ["prosody.err", "prosody.log", "prosody.pid"].map((file) =>
      fs.unlink(path.join(__dirname, file)),
    ),
  ).catch(() => {});
}

function isPortOpen() {
  const sock = new net.Socket();
  sock.connect({ port: PROSODY_PORT });
  return promise(sock, "connect")
    .then(() => {
      sock.end();
      sock.destroy();
      return true;
    })
    .catch(() => false);
}

async function waitPortOpen() {
  if (await isPortOpen()) {
    return;
  }

  await delay(1000);
  return waitPortOpen();
}

async function makeCertificate() {
  const attrs = [{ name: "commonName", value: "localhost" }];
  const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });

  await Promise.all([
    fs.writeFile(path.join(__dirname, "certs/localhost.crt"), pems.cert),
    fs.writeFile(path.join(__dirname, "certs/localhost.key"), pems.private),
  ]);
}

async function waitPortClose() {
  if (!(await isPortOpen())) {
    return;
  }

  await delay(1000);
  return waitPortClose();
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
  const opening = waitPortOpen();

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
  if (await isPortOpen()) return;
  await clean();
  return _start();
}

async function stop(signal) {
  if (!(await isPortOpen())) {
    return clean();
  }

  const closing = waitPortClose();
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
  isPortOpen,
  waitPortClose,
  waitPortOpen,
  getPid,
  start,
  stop,
  restart,
  kill,
  enableModules,
  disableModules,
  reset,
};
