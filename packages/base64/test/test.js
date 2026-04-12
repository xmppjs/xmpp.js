import { encode, decode } from "../index.js";

test("encodes ASCII strings", () => {
  expect(encode("hello")).toBe("aGVsbG8=");
});

test("decodes ASCII strings", () => {
  expect(decode("aGVsbG8=")).toBe("hello");
});

test("round-trips ASCII", () => {
  const input = "foo\0bar\0baz";
  expect(decode(encode(input))).toBe(input);
});

test("round-trips null bytes in SASL PLAIN format", () => {
  const input = "\0username\0password";
  expect(decode(encode(input))).toBe(input);
});

// Nordic characters (æ, ø, å)
test("round-trips Nordic characters æøå", () => {
  expect(decode(encode("æ"))).toBe("æ");
  expect(decode(encode("ø"))).toBe("ø");
  expect(decode(encode("å"))).toBe("å");
  expect(decode(encode("Æ"))).toBe("Æ");
  expect(decode(encode("Ø"))).toBe("Ø");
  expect(decode(encode("Å"))).toBe("Å");
});

// German umlauts
test("round-trips German umlauts äöüß", () => {
  expect(decode(encode("ä"))).toBe("ä");
  expect(decode(encode("ö"))).toBe("ö");
  expect(decode(encode("ü"))).toBe("ü");
  expect(decode(encode("ß"))).toBe("ß");
});

// French accented characters
test("round-trips French accented characters", () => {
  expect(decode(encode("é"))).toBe("é");
  expect(decode(encode("è"))).toBe("è");
  expect(decode(encode("ê"))).toBe("ê");
  expect(decode(encode("ë"))).toBe("ë");
  expect(decode(encode("ç"))).toBe("ç");
  expect(decode(encode("ñ"))).toBe("ñ");
});

// Cyrillic
test("round-trips Cyrillic characters", () => {
  const input = "Привет";
  expect(decode(encode(input))).toBe(input);
});

// CJK characters
test("round-trips CJK characters", () => {
  expect(decode(encode("日本語"))).toBe("日本語");
  expect(decode(encode("中文"))).toBe("中文");
  expect(decode(encode("한국어"))).toBe("한국어");
});

// Arabic and Hebrew
test("round-trips Arabic and Hebrew characters", () => {
  expect(decode(encode("مرحبا"))).toBe("مرحبا");
  expect(decode(encode("שלום"))).toBe("שלום");
});

// Emoji (4-byte UTF-8 sequences)
test("round-trips emoji", () => {
  expect(decode(encode("🎉"))).toBe("🎉");
  expect(decode(encode("👨‍💻"))).toBe("👨‍💻");
  expect(decode(encode("🇳🇴"))).toBe("🇳🇴");
});

// Mixed scripts
test("round-trips mixed scripts in a single string", () => {
  const input = "Hello æøå Привет 日本語 🎉";
  expect(decode(encode(input))).toBe(input);
});

// Verifies UTF-8 byte encoding rather than Latin-1
test("encodes ø as UTF-8 bytes, not Latin-1", () => {
  // ø (U+00F8) in UTF-8 is [0xC3, 0xB8] → base64 "w7g="
  // In Latin-1 (btoa) it would be [0xF8] → base64 "+A=="
  expect(encode("ø")).toBe("w7g=");
});

test("encodes æ as UTF-8 bytes, not Latin-1", () => {
  // æ (U+00E6) in UTF-8 is [0xC3, 0xA6] → base64 "w6Y="
  // In Latin-1 (btoa) it would be [0xE6] → base64 "5g=="
  expect(encode("æ")).toBe("w6Y=");
});

test("encodes å as UTF-8 bytes, not Latin-1", () => {
  // å (U+00E5) in UTF-8 is [0xC3, 0xA5] → base64 "w6U="
  // In Latin-1 (btoa) it would be [0xE5] → base64 "5Q=="
  expect(encode("å")).toBe("w6U=");
});

// Full SASL PLAIN payload with non-ASCII username
test("SASL PLAIN payload with Nordic username", () => {
  const payload = "\0øyvindranda@example.com\0session-token";
  const encoded = encode(payload);
  expect(decode(encoded)).toBe(payload);
});

test("SASL PLAIN payload with German username", () => {
  const payload = "\0müller@example.com\0password";
  expect(decode(encode(payload))).toBe(payload);
});

test("SASL PLAIN payload with Cyrillic username", () => {
  const payload = "\0иван@example.com\0password";
  expect(decode(encode(payload))).toBe(payload);
});
