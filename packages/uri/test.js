import { parse } from "./index.js";
import jid from "@xmpp/jid";

test("parse", () => {
  expect(
    parse(
      "xmpp://guest@example.com/support@example.com/truc?message;subject=Hello%20World",
    ),
  ).toEqual({
    authority: jid("guest@example.com"),
    path: jid("support@example.com/truc"),
    query: {
      type: "message",
      params: {
        subject: "Hello World",
      },
    },
  });

  expect(jid("foobar")).toEqual(jid("foobar"));

  expect(
    parse(
      "xmpp:support@example.com/truc?message;subject=Hello%20World;body=foobar",
    ),
  ).toEqual({
    path: jid("support@example.com/truc"),
    query: {
      type: "message",
      params: {
        subject: "Hello World",
        body: "foobar",
      },
    },
  });

  expect(parse("xmpp:support@example.com/truc")).toEqual({
    path: jid("support@example.com/truc"),
  });

  expect(parse("xmpp:support@example.com/")).toEqual({
    path: jid("support@example.com/"),
  });

  expect(parse("xmpp:support@example.com/?foo")).toEqual({
    path: jid("support@example.com/"),
    query: {
      type: "foo",
      params: {},
    },
  });

  expect(parse("xmpp:support@example.com?foo")).toEqual({
    path: jid("support@example.com"),
    query: {
      type: "foo",
      params: {},
    },
  });
});
