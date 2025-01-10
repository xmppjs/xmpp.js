import Connection from "../index.js";

test("isSecure()", () => {
  const conn = new Connection();

  conn.socket = null;
  expect(conn.isSecure()).toBe(false);

  conn.socket = { secure: false };
  expect(conn.isSecure()).toBe(false);

  conn.socket = { secure: true };
  expect(conn.isSecure()).toBe(true);
});
