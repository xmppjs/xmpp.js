import { EventEmitter } from "../index.js";

test("on/off", () => {
  const emitter = new EventEmitter();

  const handler = jest.fn((...values) => {
    expect(values).toEqual([1, 2]);
  });
  emitter.on("foo", handler);

  emitter.emit("foo", 1, 2);
  expect(handler).toHaveBeenCalledTimes(1);

  emitter.off("foo", handler);

  emitter.emit("foo");
  expect(handler).toHaveBeenCalledTimes(1);
});

test("addListener/removeListener", () => {
  const emitter = new EventEmitter();

  const handler = jest.fn();
  emitter.addListener("foo", handler);

  emitter.emit("foo");
  expect(handler).toHaveBeenCalledTimes(1);

  emitter.removeListener("foo", handler);

  emitter.emit("foo");
  expect(handler).toHaveBeenCalledTimes(1);
});

test("once", () => {
  const emitter = new EventEmitter();

  const handler = jest.fn();
  emitter.once("foo", handler);
  emitter.emit("foo");
  emitter.emit("foo");

  expect(handler).toHaveBeenCalledTimes(1);
});

test("error", () => {
  const emitter = new EventEmitter();

  const handler = jest.fn();
  emitter.once("error", handler);
  emitter.emit("error", new Error("foo"));

  expect(handler).toHaveBeenCalledTimes(1);
});
