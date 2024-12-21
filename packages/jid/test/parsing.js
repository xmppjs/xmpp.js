import parse from "../lib/parse.js";

test('should parse a "domain" JID', () => {
  const j = parse("d");
  expect(j.getLocal()).toBe("");
  expect(j.getDomain()).toBe("d");
  expect(j.getResource()).toBe("");
});

test('should parse a "user@domain" JID', () => {
  const j = parse("u@d");
  expect(j.getLocal()).toBe("u");
  expect(j.getDomain()).toBe("d");
  expect(j.getResource()).toBe("");
});

test('should parse a "domain/resource" JID', () => {
  const j = parse("d/r");
  expect(j.getLocal()).toBe("");
  expect(j.getDomain()).toBe("d");
  expect(j.getResource()).toBe("r");
});

test('should parse a "user@domain/resource" JID', () => {
  const j = parse("u@d/r");
  expect(j.getLocal()).toBe("u");
  expect(j.getDomain()).toBe("d");
  expect(j.getResource()).toBe("r");
});

test('should parse a "user@domain/resource@thing" JID', () => {
  const j = parse("u@d/r@foo");
  expect(j.getLocal()).toBe("u");
  expect(j.getDomain()).toBe("d");
  expect(j.getResource()).toBe("r@foo");
});

test('should parse a "user@domain/resource/thing" JID', () => {
  const j = parse("u@d/r/foo");
  expect(j.getLocal()).toBe("u");
  expect(j.getDomain()).toBe("d");
  expect(j.getResource()).toBe("r/foo");
});

test("should parse an internationalized domain name as unicode", () => {
  const j = parse("öko.de");
  expect(j.getDomain()).toBe("öko.de");
});

test("should parse an empty domain JID (#109)", () => {
  const j = parse("u@d", "");
  expect(j.getLocal()).toBe("u");
  expect(j.getDomain()).toBe("d");
  expect(j.getResource()).toBe("");
});

test("should allow access to jid parts using keys", () => {
  const j = parse("u@d/r", "");
  expect(j.local).toBe("u");
  expect(j.domain).toBe("d");
  expect(j.resource).toBe("r");
});

test("shouldn't get U_STRINGPREP_PROHIBITED_ERROR (#93)", () => {
  expect(() => {
    const j = parse("f u@d");
    j.toString();
  }).not.toThrow();
});
