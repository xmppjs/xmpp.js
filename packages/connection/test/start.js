import Connection from "../index.js";

test("rejects if connection is not offline", () => {
  const conn = new Connection();
  conn.status = "online";
  return conn.start().catch((err) => {
    expect(err instanceof Error).toBe(true);
    expect(err.message).toBe("Connection is not offline");
  });
});
