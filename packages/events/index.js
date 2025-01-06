import { EventEmitter } from "events";

import timeout from "./lib/timeout.js";
import delay from "./lib/delay.js";
import TimeoutError from "./lib/TimeoutError.js";
import promise from "./lib/promise.js";
import Deferred from "./lib/Deferred.js";
import procedure from "./lib/procedure.js";

export {
  EventEmitter,
  timeout,
  delay,
  TimeoutError,
  promise,
  Deferred,
  procedure,
};
