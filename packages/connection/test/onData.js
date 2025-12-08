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
