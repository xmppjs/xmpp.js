#!/usr/bin/env node

import server from "./index.js";

// eslint-disable-next-line unicorn/no-unreadable-array-destructuring
const [, , method, ...args] = process.argv;

const commands = {
  start() {
    return server.start();
  },
  stop() {
    return server.stop();
  },
  restart() {
    return server.restart();
  },
  async status() {
    const isStarted = await server.isPortOpen();
    if (isStarted) {
      console.log("started");
    } else {
      console.log("stopped");
    }
  },
  async enable(...args) {
    await server.enableModules(...args);
    await this.restart();
  },
  async disable(...args) {
    await server.disableModules(...args);
    await this.restart();
  },
};

if (commands[method]) {
  await commands[method](...args);
} else {
  console.error("Valid commands are start/stop/restart/status/enable/disable.");
}
