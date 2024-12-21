import JID from "../lib/JID.js";

test("cocerce to string", () => {
  const addr = new JID("foo", "bar");
  expect(addr + "").toBe(addr.toString());
  expect("" + addr).toBe(addr.toString());
  expect(addr == addr.toString()).toBe(true);
});

test("cocerce to NaN", () => {
  const addr = new JID("foo", "bar");
  expect(isNaN(+addr)).toBe(true);
  expect(isNaN(addr + 4)).toBe(true);
});
