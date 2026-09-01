import {
  mockClient,
  promiseSend,
  mockInput,
  promiseError,
  xml,
} from "@xmpp/test";

test("empty result when the handler returns true", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  iqCallee.get("bar", "foo", () => true);

  mockInput(
    xmpp,
    // prettier-ignore
    xml('iq', {type: "get", id: "123"},
      xml('foo', { xmlns: "bar" })
    ),
  );

  expect(await promiseSend(xmpp)).toEqual(
    xml("iq", { id: "123", type: "result" }),
  );
});

test("iqs with text children are valid", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  iqCallee.get("bar", "foo", () => true);

  mockInput(
    xmpp,
    // prettier-ignore
    xml('iq', { type: "get", id: "123" },
      "\n",
      xml("foo", { xmlns: "bar" }),
      "foo",
    ),
  );

  expect(await promiseSend(xmpp)).toEqual(
    xml("iq", { id: "123", type: "result" }),
  );
});

test("iqs with multiple element children are invalid", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  iqCallee.get("bar", "foo", () => true);

  mockInput(
    xmpp,
    // prettier-ignore
    xml('iq', {type: "get", id: "123"},
      xml("foo", {xmlns: "bar"}),
      xml("foo", {xmlns: "bar"})
    ),
  );

  expect(await promiseSend(xmpp)).toEqual(
    // prettier-ignore
    xml('iq', {id: "123", type: "error"},
      xml("foo", {xmlns: "bar"}),
      xml("error", {type: "modify"},
        xml("bad-request", {xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas"})
      )
    ),
  );
});

test("non empty result when the handler returns an xml.Element", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  iqCallee.get("bar", "foo", () => {
    return xml("hello");
  });

  mockInput(
    xmpp,
    // prettier-ignore
    xml('iq', {type: "get", id: "123"},
      xml("foo", { xmlns: "bar" })
    ),
  );

  expect(await promiseSend(xmpp)).toEqual(
    // prettier-ignore
    xml('iq', { id: "123", type: "result" },
      xml('hello')
    ),
  );
});

test("service unavailable error reply when there are no handler", async () => {
  const xmpp = mockClient();

  xmpp.mockInput(
    // prettier-ignore
    xml('iq', { type: "get", id: "123" },
      xml('foo', {xmlns: "bar"})
    ),
  );

  expect(await promiseSend(xmpp)).toEqual(
    // prettier-ignore
    xml('iq', {id: "123", type: "error"},
      xml('foo', {xmlns: "bar"}),
      xml("error", {type: "cancel"},
        xml('service-unavailable', {xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas"})
      )
    ),
  );
});

test("internal server error reply when handler throws an error", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  const error = new Error("foobar");
  const errorPromise = promiseError(xmpp);
  const outputPromise = promiseSend(xmpp);

  iqCallee.get("bar", "foo", () => {
    throw error;
  });

  mockInput(
    xmpp,
    // prettier-ignore
    xml('iq', { type: "get", id: "123" },
      xml('foo', {xmlns: "bar"})
    ),
  );

  expect(await errorPromise).toBe(error);
  expect(await outputPromise).toEqual(
    // prettier-ignore
    xml('iq', {id: "123", type: "error"},
      xml('foo', {xmlns: "bar"}),
      xml('error', {type: "cancel"},
        xml('internal-server-error', {xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas"})
      )
    ),
  );
});

test("internal server error reply when handler rejects with an error", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  const error = new Error("foobar");
  const errorPromise = promiseError(xmpp);
  const outputPromise = promiseSend(xmpp);

  iqCallee.set("bar", "foo", () => {
    return Promise.reject(error);
  });

  mockInput(
    xmpp,
    // prettier-ignore
    xml('iq', { type: "set", id: "123" },
      xml('foo', {xmlns: "bar"})
    ),
  );

  expect(await errorPromise).toBe(error);
  expect(await outputPromise).toEqual(
    xml(
      "iq",
      { id: "123", type: "error" },
      xml("foo", { xmlns: "bar" }),
      xml(
        "error",
        { type: "cancel" },
        xml("internal-server-error", {
          xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas",
        }),
      ),
    ),
  );
});

test("stanza error reply when handler returns an error element", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  const outputPromise = promiseSend(xmpp);

  const errorElement =
    // prettier-ignore
    xml('error', {type: "foo"},
      xml('bar', {xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas"})
    );

  iqCallee.set("bar", "foo", () => {
    return errorElement;
  });

  mockInput(
    xmpp,
    // prettier-ignore
    xml('iq', {type: "set", id: "123"},
      xml('foo', {xmlns: "bar"})
    ),
  );

  expect(await outputPromise).toEqual(
    // prettier-ignore
    xml('iq', {id: "123", type: "error"},
      xml("foo", {xmlns: "bar"}),
      errorElement
    ),
  );
});
