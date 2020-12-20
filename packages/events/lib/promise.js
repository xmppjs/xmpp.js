"use strict";

const TimeoutError = require("./TimeoutError");

module.exports = function promise(EE, event, rejectEvent = "error", timeout) {
  return new Promise((resolve, reject) => {
    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      EE.removeListener(event, onEvent);
      EE.removeListener(rejectEvent, onError);
    };

    function onError(reason) {
      reject(reason);
      cleanup();
    }

    function onEvent(value) {
      resolve(value);
      cleanup();
    }

    EE.once(event, onEvent);
    if (rejectEvent) {
      EE.once(rejectEvent, onError);
    }

    if (timeout) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new TimeoutError());
      }, timeout);
    }
  });
};
