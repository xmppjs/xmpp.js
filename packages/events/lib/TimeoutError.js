export default class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
    // Error.captureStackTrace?.(this, this.constructor);
  }
}
