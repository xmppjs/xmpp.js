"use strict";

const test = require("ava");
const Connection = require("..");
const xml = require("@xmpp/xml");

test("#_streamError", (t) => {
  t.plan(2);
  const conn = new Connection();
  conn.send = (el) => {
    t.deepEqual(
      el,
      // prettier-ignore
      xml('stream:error', {}, [
        xml('foo-bar', {xmlns: 'urn:ietf:params:xml:ns:xmpp-streams'}),
      ]),
    );
    return Promise.resolve();
  };

  conn._end = () => {
    t.pass();
    return Promise.resolve();
  };

  return conn._streamError("foo-bar");
});
