// eslint-disable-next-line import/enforce-node-protocol-usage
import { EventEmitter } from "events";

import timeout from "./lib/timeout.js";
import delay from "./lib/delay.js";
import TimeoutError from "./lib/TimeoutError.js";
import promise from "./lib/promise.js";
import Deferred from "./lib/Deferred.js";
import procedure from "./lib/procedure.js";
import listeners from "./lib/listeners.js";
import onoff from "./lib/onoff.js";

function tick() {
  return new Promise((resolve) => {
    process.nextTick(resolve);
  });
}

export {
  EventEmitter,
  timeout,
  delay,
  TimeoutError,
  promise,
  Deferred,
  procedure,
  listeners,
  onoff,
  tick,
};
