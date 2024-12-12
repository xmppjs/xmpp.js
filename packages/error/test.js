"use strict";

const test = require("ava");
const XMPPError = require(".");
// eslint-disable-next-line n/no-extraneous-require
const parse = require("@xmpp/xml/lib/parse.js");

test("fromElement", (t) => {
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

  t.is(error instanceof Error, true);
  t.is(error.name, "XMPPError");
  t.is(error.condition, "some-condition");
  t.is(error.text, "foo");
  t.is(error.application, application_element);
});

test("fromElement - whitespaces", (t) => {
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

  t.is(error instanceof Error, true);
  t.is(error.name, "XMPPError");
  t.is(error.condition, "some-condition");
  t.is(error.text, "\n        foo\n      ");
  t.is(
    error.application.toString(),
    `<escape-your-data xmlns="http://example.org/ns"/>`,
  );
});
