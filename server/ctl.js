#!/usr/bin/env node

import server from "./index.js";

const method = process.argv[2];

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
};

if (commands[method]) {
  await commands[method]();
} else {
  console.error("Valid commands are start/stop/restart/status.");
}
