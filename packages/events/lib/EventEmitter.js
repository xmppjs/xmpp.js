export default class EventEmitter extends EventTarget {
  #listeners = Object.create(null);

  addListener(type, handler) {
    let listeners = this.#listeners[type];
    if (!listeners) {
      listeners = new WeakMap();
      this.#listeners[type] = listeners;
    }

    const real_handler = function (event) {
      handler(...event.detail);
    };

    listeners.set(handler, real_handler);
    super.addEventListener(type, real_handler);
  }

  removeListener(event, handler) {
    let listeners = this.#listeners[event];
    if (!listeners) return;

    const real_handler = listeners.get(handler);
    if (!real_handler) return;

    super.removeEventListener(event, real_handler);
  }

  once(type, handler) {
    const real_handler = (...args) => {
      this.removeListener(type, real_handler);
      handler(...args);
    };

    this.addListener(type, real_handler);
  }

  emit(name, ...values) {
    const event = new Event(name);
    event.detail = values;
    super.dispatchEvent(event);
  }

  on(...args) {
    return this.addListener(...args);
  }

  off(...args) {
    return this.removeListener(...args);
  }
}
