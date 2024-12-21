import jid from "../index.js";

test("should parsed JIDs should be equal", () => {
  const j1 = jid("foo@bar/baz");
  const j2 = jid("foo@bar/baz");
  expect(j1.equals(j2)).toBe(true);
});

test("should parsed JIDs should be not equal", () => {
  const j1 = jid("foo@bar/baz");
  const j2 = jid("quux@bar/baz");
  expect(j1.equals(j2)).toBe(false);
});

test("should ignore case in user", () => {
  const j1 = jid("foo@bar/baz");
  const j2 = jid("FOO@bar/baz");
  expect(j1.equals(j2)).toBe(true);
});

test("should ignore case in domain", () => {
  const j1 = jid("foo@bar/baz");
  const j2 = jid("foo@BAR/baz");
  expect(j1.equals(j2)).toBe(true);
});

test("should not ignore case in resource", () => {
  const j1 = jid("foo@bar/baz");
  const j2 = jid("foo@bar/Baz");
  expect(j1.equals(j2)).toBe(false);
});

test("should ignore international caseness", () => {
  const j1 = jid("föö@bär/baß");
  const j2 = jid("fÖö@BÄR/baß");
  expect(j1.equals(j2)).toBe(true);
});

test("should work with bare JIDs", () => {
  const j1 = jid("romeo@example.net/9519407536580081");
  const j2 = jid("romeo@example.net");
  expect(j1.bare().equals(j2)).toBe(true);
});
