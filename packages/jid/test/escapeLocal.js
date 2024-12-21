import jid from "../index.js";

test("Should not change string - issue 43", () => {
  const test = "test\u001A@example.com";

  const addr = jid(test);
  expect(addr.local).toBe("test\u001A");
});

test("Should escape - issue 43", () => {
  const test = "test\u001Aa@example.com";

  const addr = jid(test);
  expect(addr.local).toBe("testa");
});
