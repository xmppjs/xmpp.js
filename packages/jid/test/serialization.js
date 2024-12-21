import JID from "../lib/JID.js";

test('should serialize a "domain" JID', () => {
  const j = new JID(null, "d");
  expect(j.toString()).toBe("d");
});

test('should serialize a "user@domain" JID', () => {
  const j = new JID("u", "d");
  expect(j.toString()).toBe("u@d");
});

test('should serialize a "domain/resource" JID', () => {
  const j = new JID(null, "d", "r");
  expect(j.toString()).toBe("d/r");
});

test('should serialize a "user@domain/resource" JID', () => {
  const j = new JID("u", "d", "r");
  expect(j.toString()).toBe("u@d/r");
});
