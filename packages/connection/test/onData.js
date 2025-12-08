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

test("#_onData with null parser", () => {
  const conn = new Connection();
  conn.parser = null;

  // Should not throw when parser is null
  expect(() => {
    conn._onData(Buffer.from("<foo>"));
  }).not.toThrow();
});
