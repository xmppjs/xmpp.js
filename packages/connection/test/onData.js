import Connection from "../index.js";

test("#_onData", () => {
  expect.assertions(1);
  const foo = "<foo>";
  const conn = new Connection();
  conn.parser = {
    write(str) {
      expect(str).toBe(foo);
    },
  };

  conn._onData(foo);
});

test("#_onData does not throw after _detachParser has been called", () => {
  expect.assertions(1);
  const foo = "<foo>";
  const conn = new Connection();
  conn._detachParser();
  expect(() => {
    conn._onData(foo);
  }).not.toThrow();
});
