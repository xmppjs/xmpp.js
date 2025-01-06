import JID from "../index.js";

test("escape `space cadet@example.com`", () => {
  const esc = new JID("space cadet", "example.com");
  expect(esc.toString()).toBe(String.raw`space\20cadet@example.com`);
  expect(esc.toString(true)).toBe("space cadet@example.com");
});

test('escape `call me "ishmael"@example.com`', () => {
  const esc = new JID('call me "ishmael"', "example.com");
  expect(esc.toString()).toBe(
    String.raw`call\20me\20\22ishmael\22@example.com`,
  );
  expect(esc.toString(true)).toBe('call me "ishmael"@example.com');
});

test("escape `at&t guy@example.com`", () => {
  const esc = new JID("at&t guy", "example.com");
  expect(esc.toString()).toBe(String.raw`at\26t\20guy@example.com`);
  expect(esc.toString(true)).toBe("at&t guy@example.com");
});

test("escape `d'artagnan@example.com`", () => {
  const esc = new JID("d'artagnan", "example.com");
  expect(esc.toString()).toBe(String.raw`d\27artagnan@example.com`);
  expect(esc.toString(true)).toBe("d'artagnan@example.com");
});

test("escape `/.fanboy@example.com`", () => {
  const esc = new JID("/.fanboy", "example.com");
  expect(esc.toString()).toBe(String.raw`\2f.fanboy@example.com`);
  expect(esc.toString(true)).toBe("/.fanboy@example.com");
});

test("escape `::foo::@example.com`", () => {
  const esc = new JID("::foo::", "example.com");
  expect(esc.toString()).toBe(String.raw`\3a\3afoo\3a\3a@example.com`);
  expect(esc.toString(true)).toBe("::foo::@example.com");
});

test("escape `<foo>@example.com`", () => {
  const esc = new JID("<foo>", "example.com");
  expect(esc.toString()).toBe(String.raw`\3cfoo\3e@example.com`);
  expect(esc.toString(true)).toBe("<foo>@example.com");
});

test("escape `user@host@example.com`", () => {
  const esc = new JID("user@host", "example.com");
  expect(esc.toString()).toBe(String.raw`user\40host@example.com`);
  expect(esc.toString(true)).toBe("user@host@example.com");
});

test("escape `c:\\net@example.com`", () => {
  const esc = new JID(String.raw`c:\net`, "example.com");
  expect(esc.toString()).toBe(String.raw`c\3a\5cnet@example.com`);
  expect(esc.toString(true)).toBe(String.raw`c:\net@example.com`);
});

test("escape `c:\\\\net@example.com`", () => {
  const esc = new JID(String.raw`c:\\net`, "example.com");
  expect(esc.toString()).toBe(String.raw`c\3a\5c\5cnet@example.com`);
  expect(esc.toString(true)).toBe(String.raw`c:\\net@example.com`);
});

test("escape `c:\\cool stuff@example.com`", () => {
  const esc = new JID(String.raw`c:\cool stuff`, "example.com");
  expect(esc.toString()).toBe(String.raw`c\3a\5ccool\20stuff@example.com`);
  expect(esc.toString(true)).toBe(String.raw`c:\cool stuff@example.com`);
});

test("escape `c:\\5commas@example.com`", () => {
  const esc = new JID(String.raw`c:\5commas`, "example.com");
  expect(esc.toString()).toBe(String.raw`c\3a\5c5commas@example.com`);
  expect(esc.toString(true)).toBe(String.raw`c:\5commas@example.com`);
});

test("escape `space\\20cadet@example.com`", () => {
  const esc = new JID(String.raw`space\20cadet`, "example.com");
  expect(esc.toString()).toBe(String.raw`space\20cadet@example.com`);
  expect(esc.toString(true)).toBe("space cadet@example.com");
});

test("escape `at\\26t\\20guy@example.com`", () => {
  const esc = new JID(String.raw`at\26t\20guy`, "example.com");
  expect(esc.toString()).toBe(String.raw`at\26t\20guy@example.com`);
  expect(esc.toString(true)).toBe("at&t guy@example.com");
});

test("escape `d\\27artagnan@example.com`", () => {
  const esc = new JID(String.raw`d\27artagnan`, "example.com");
  expect(esc.toString()).toBe(String.raw`d\27artagnan@example.com`);
  expect(esc.toString(true)).toBe("d'artagnan@example.com");
});

test("escape `\\2f.fanboy@example.com`", () => {
  const esc = new JID(String.raw`\2f.fanboy`, "example.com");
  expect(esc.toString()).toBe(String.raw`\2f.fanboy@example.com`);
  expect(esc.toString(true)).toBe("/.fanboy@example.com");
});

test("escape `\\3a\\3afoo\\3a\\3a@example.com`", () => {
  const esc = new JID(String.raw`\3a\3afoo\3a\3a`, "example.com");
  expect(esc.toString()).toBe(String.raw`\3a\3afoo\3a\3a@example.com`);
  expect(esc.toString(true)).toBe("::foo::@example.com");
});

test("escape `\\3cfoo\\3e@example.com`", () => {
  const esc = new JID(String.raw`\3cfoo\3e`, "example.com");
  expect(esc.toString()).toBe(String.raw`\3cfoo\3e@example.com`);
  expect(esc.toString(true)).toBe("<foo>@example.com");
});

test("escape `user\\40host@example.com`", () => {
  const esc = new JID(String.raw`user\40host`, "example.com");
  expect(esc.toString()).toBe(String.raw`user\40host@example.com`);
  expect(esc.toString(true)).toBe("user@host@example.com");
});

test("escape `c\\3a\\5cnet@example.com`", () => {
  const esc = new JID(String.raw`c\3a\5cnet`, "example.com");
  expect(esc.toString()).toBe(String.raw`c\3a\5cnet@example.com`);
  expect(esc.toString(true)).toBe(String.raw`c:\net@example.com`);
});

test("escape `c\\3a\\5ccool\\20stuff@example.com`", () => {
  const esc = new JID(String.raw`c\3a\5ccool\20stuff`, "example.com");
  expect(esc.toString()).toBe(String.raw`c\3a\5ccool\20stuff@example.com`);
  expect(esc.toString(true)).toBe(String.raw`c:\cool stuff@example.com`);
});

test("escape `c\\3a\\5c5commas@example.com`", () => {
  const esc = new JID(String.raw`c\3a\5c5commas`, "example.com");
  expect(esc.toString()).toBe(String.raw`c\3a\5c5commas@example.com`);
  expect(esc.toString(true)).toBe(String.raw`c:\5commas@example.com`);
});
