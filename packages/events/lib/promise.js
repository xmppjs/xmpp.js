import onoff from "./onoff.js";
import TimeoutError from "./TimeoutError.js";

export default function promise(target, event, rejectEvent = "error", timeout) {
  return new Promise((resolve, reject) => {
    let timeoutId;

    const { off, once } = onoff(target);

    const cleanup = () => {
      clearTimeout(timeoutId);
      off(event, onEvent);
      off(rejectEvent, onError);
    };

    function onError(reason) {
      reject(reason);
      cleanup();
    }

    function onEvent(value) {
      resolve(value);
      cleanup();
    }

    once(event, onEvent);
    if (rejectEvent) {
      once(rejectEvent, onError);
    }

    if (timeout) {
      const error = new TimeoutError();
      timeoutId = setTimeout(() => {
        cleanup();
        reject(error);
      }, timeout);
    }
  });
}
