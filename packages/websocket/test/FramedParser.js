"use strict";

const test = require("ava");
const Parser = require("../lib/FramedParser");

test.cb("framed parser", (t) => {
  const parser = new Parser();

  t.plan(4);

  parser.on("start", (el) => {
    t.is(el.toString(), '<open xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>');
  });

  parser.on("element", (el) => {
    t.is(el.parent, null);
    t.is(el.toString(), "<bar>hello</bar>");
  });

  parser.on("end", (el) => {
    t.is(el.toString(), '<close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>');
    t.end();
  });

  parser.write(
    '<open xmlns="urn:ietf:params:xml:ns:xmpp-framing"/><bar>hello</bar><close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>',
  );
});
