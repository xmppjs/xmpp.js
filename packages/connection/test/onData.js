import Connection from "../index.js";

test("#_onData", () => {
  expect.assertions(2);
  const foo = "<foo>";
  const conn = new Connection();
  conn.parser = {
    write(str) {
      expect(str).toBe(foo);
    },
  };

  conn.on("input", (data) => {
    expect(data).toBe(foo);
  });
  conn._onData(foo);
});
