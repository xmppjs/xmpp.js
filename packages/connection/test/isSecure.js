import Connection from "../index.js";

test("isSecure()", () => {
  const conn = new Connection();

  conn.socket = null;
  expect(conn.isSecure()).toBe(false);

  conn.socket = { isSecure: () => false };
  expect(conn.isSecure()).toBe(false);

  conn.socket = { isSecure: () => true };
  expect(conn.isSecure()).toBe(true);
});
