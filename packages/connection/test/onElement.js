import xml from "@xmpp/xml";

import Connection from "../index.js";

test("#_onElement", (done) => {
  expect.assertions(2);
  const foo = <foo />;
  const conn = new Connection();
  conn.on("element", (el) => {
    expect(el).toBe(foo);
  });
  conn.on("nonza", (el) => {
    expect(el).toBe(foo);
    done();
  });
  conn._onElement(foo);
});

test("#_onElement stream:error", (done) => {
  expect.assertions(7);
  // prettier-ignore

  const application = xml('application')

  const foo = xml("error", { xmlns: "http://etherx.jabber.org/streams" }, [
    xml("foo-bar", { xmlns: "urn:ietf:params:xml:ns:xmpp-streams" }),
    xml("text", {}, "hello"),
    application,
  ]);
  const conn = new Connection();
  jest.spyOn(conn, "disconnect").mockImplementation(() => {
    done();
    return Promise.resolve();
  });

  conn.on("element", (el) => {
    expect(el).toBe(foo);
  });
  conn.on("nonza", (el) => {
    expect(el).toBe(foo);
  });
  conn.on("error", (error) => {
    expect(error.name).toBe("StreamError");
    expect(error.condition).toBe("foo-bar");
    expect(error.message).toBe("foo-bar - hello");
    expect(error.application).toBe(application);
    expect(error.element).toBe(foo);
  });
  conn._onElement(foo);
});
