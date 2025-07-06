import promise from "../lib/promise.js";
import { EventEmitter } from "../index.js";

class Socket extends EventEmitter {
  constructor(fn) {
    super();
    this.fn = fn;
  }

  async connect() {
    if (!this.fn) return;
    await Promise.resolve();
    this.fn();
  }
}

test('resolves if "event" is emitted', async () => {
  const value = {};
  // eslint-disable-next-line func-names
  const socket = new Socket(function () {
    this.emit("connect", value);
  });
  socket.connect();
  const p = promise(socket, "connect");
  const result = await p;
  expect(result).toBe(value);
});

test('rejects if "errorEvent" is emitted', async () => {
  const error = new Error("foobar");
  // eslint-disable-next-line func-names
  const socket = new Socket(function () {
    this.emit("error", error);
  });
  socket.connect();
  const p = promise(socket, "connect", "error");
  await expect(p).rejects.toBe(error);
});
