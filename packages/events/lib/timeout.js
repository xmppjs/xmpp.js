import TimeoutError from "./TimeoutError.js";
import delay from "./delay.js";

export default function timeout(promise, ms) {
  const promiseDelay = delay(ms);

  function cancelDelay() {
    clearTimeout(promiseDelay.timeout);
  }

  return Promise.race([
    promise.finally(cancelDelay),
    promiseDelay.then(() => {
      throw new TimeoutError();
    }),
  ]);
}
