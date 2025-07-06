<<<<<<< Updated upstream
import onoff from "./onoff.js";

=======
>>>>>>> Stashed changes
import TimeoutError from "./TimeoutError.js";

export default function promise(target, event, rejectEvent = "error", timeout) {
  return new Promise((resolve, reject) => {
    let timeoutId;

    const cleanup = () => {
      clearTimeout(timeoutId);
      target.off(event, onEvent);
      target.off(rejectEvent, onError);
    };

    function onError(reason) {
      reject(reason);
      cleanup();
    }

    function onEvent(value) {
      resolve(value);
      cleanup();
    }

    target.on(event, onEvent, { once: true });
    if (rejectEvent) {
      target.on(rejectEvent, onError, { once: true });
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
