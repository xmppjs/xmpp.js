import JID from "../lib/JID.js";

test("cocerce to string", () => {
  const addr = new JID("foo", "bar");
  expect(addr + "").toBe(addr.toString());
  expect("" + addr).toBe(addr.toString());
  expect(addr == addr.toString()).toBe(true);
});

test("cocerce to NaN", () => {
  const addr = new JID("foo", "bar");
  expect(Number.isNaN(+addr)).toBe(true);
});
