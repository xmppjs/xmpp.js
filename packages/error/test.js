import parse from "@xmpp/xml/lib/parse.js";

import XMPPError from "./index.js";

test("fromElement", () => {
  const application_element = (
    <escape-your-data xmlns="http://example.org/ns" />
  );

  const nonza = (
    <stream:error>
      <some-condition xmlns="urn:ietf:params:xml:ns:xmpp-streams" />
      <text xmlns="urn:ietf:params:xml:ns:xmpp-streams" xml:lang="langcode">
        foo
      </text>
      {application_element}
    </stream:error>
  );

  const error = XMPPError.fromElement(nonza);

  expect(error instanceof Error).toBe(true);
  expect(error instanceof XMPPError).toBe(true);
  expect(error.name).toBe("XMPPError");
  expect(error.condition).toBe("some-condition");
  expect(error.text).toBe("foo");
  expect(error.application).toBe(application_element);
});

test("fromElement - whitespaces", () => {
  const nonza = parse(
    `
    <stream:error>
      <some-condition xmlns="urn:ietf:params:xml:ns:xmpp-streams" />
      <text xmlns="urn:ietf:params:xml:ns:xmpp-streams" xml:lang="langcode">
        foo
      </text>
      <escape-your-data xmlns='http://example.org/ns'/>
    </stream:error>
  `.trim(),
  );

  const error = XMPPError.fromElement(nonza);

  expect(error instanceof Error).toBe(true);
  expect(error instanceof XMPPError).toBe(true);
  expect(error.name).toBe("XMPPError");
  expect(error.condition).toBe("some-condition");
  expect(error.text).toBe("\n        foo\n      ");
  expect(error.application.toString()).toBe(
    `<escape-your-data xmlns="http://example.org/ns"/>`,
  );
});
