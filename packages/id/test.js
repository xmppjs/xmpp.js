import xid from "./index.js";

test("returns a non empty string", () => {
  expect(typeof xid()).toBe("string");
  expect(xid().length > 0).toBe(true);
});

test("duplicates", () => {
  const id = xid();
  for (let i = 0; i < 10_000; i++) {
    expect(id).not.toBe(xid());
  }
});
