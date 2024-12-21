import Parser from "../lib/FramedParser.js";

test("framed parser", (done) => {
  const parser = new Parser();

  expect.assertions(4);

  parser.on("start", (el) => {
    expect(el.toString()).toBe(
      '<open xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>',
    );
  });

  parser.on("element", (el) => {
    expect(el.parent).toBe(null);
    expect(el.toString()).toBe("<bar>hello</bar>");
  });

  parser.on("end", (el) => {
    expect(el.toString()).toBe(
      '<close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>',
    );
    done();
  });

  parser.write(
    '<open xmlns="urn:ietf:params:xml:ns:xmpp-framing"/><bar>hello</bar><close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>',
  );
});
