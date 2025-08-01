import TimeoutError from "./TimeoutError.js";
import delay from "./delay.js";

export default function timeout(promise, ms) {
  const promiseDelay = delay(ms);

  function cancelDelay() {
    clearTimeout(promiseDelay.timeout);
  }

  const error = new TimeoutError();
  return Promise.race([
    promise.finally(cancelDelay),
    promiseDelay.then(() => {
      throw error;
    }),
  ]);
}
