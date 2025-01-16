import { mockClient, promiseSend, mockInput, promiseError } from "@xmpp/test";

test("empty result when the handler returns true", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  iqCallee.get("bar", "foo", () => true);

  mockInput(
    xmpp,
    <iq type="get" id="123">
      <foo xmlns="bar" />
    </iq>,
  );

  expect(await promiseSend(xmpp)).toEqual(<iq id="123" type="result" />);
});

test("iqs with text children are valid", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  iqCallee.get("bar", "foo", () => true);

  mockInput(
    xmpp,
    <iq type="get" id="123">
      {"\n"}
      <foo xmlns="bar" />
      {"foo"}
    </iq>,
  );

  expect(await promiseSend(xmpp)).toEqual(<iq id="123" type="result" />);
});

test("iqs with multiple element children are invalid", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  iqCallee.get("bar", "foo", () => true);

  mockInput(
    xmpp,
    <iq type="get" id="123">
      <foo xmlns="bar" />
      <foo xmlns="bar" />
    </iq>,
  );

  expect(await promiseSend(xmpp)).toEqual(
    <iq id="123" type="error">
      <foo xmlns="bar" />
      <error type="modify">
        <bad-request xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
      </error>
    </iq>,
  );
});

test("non empty result when the handler returns an xml.Element", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  iqCallee.get("bar", "foo", () => {
    return <hello />;
  });

  mockInput(
    xmpp,
    <iq type="get" id="123">
      <foo xmlns="bar" />
    </iq>,
  );

  expect(await promiseSend(xmpp)).toEqual(
    <iq id="123" type="result">
      <hello />
    </iq>,
  );
});

test("service unavailable error reply when there are no handler", async () => {
  const xmpp = mockClient();

  xmpp.mockInput(
    <iq type="get" id="123">
      <foo xmlns="bar" />
    </iq>,
  );

  expect(await promiseSend(xmpp)).toEqual(
    <iq id="123" type="error">
      <foo xmlns="bar" />
      <error type="cancel">
        <service-unavailable xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
      </error>
    </iq>,
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
    <iq type="get" id="123">
      <foo xmlns="bar" />
    </iq>,
  );

  expect(await errorPromise).toBe(error);
  expect(await outputPromise).toEqual(
    <iq id="123" type="error">
      <foo xmlns="bar" />
      <error type="cancel">
        <internal-server-error xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
      </error>
    </iq>,
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
    <iq type="set" id="123">
      <foo xmlns="bar" />
    </iq>,
  );

  expect(await errorPromise).toBe(error);
  expect(await outputPromise).toEqual(
    <iq id="123" type="error">
      <foo xmlns="bar" />
      <error type="cancel">
        <internal-server-error xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
      </error>
    </iq>,
  );
});

test("stanza error reply when handler returns an error element", async () => {
  const xmpp = mockClient();
  const { iqCallee } = xmpp;

  const outputPromise = promiseSend(xmpp);

  const errorElement = (
    <error type="foo">
      <bar xmlns="urn:ietf:params:xml:ns:xmpp-stanzas" />
    </error>
  );

  iqCallee.set("bar", "foo", () => {
    return errorElement;
  });

  mockInput(
    xmpp,
    <iq type="set" id="123">
      <foo xmlns="bar" />
    </iq>,
  );

  expect(await outputPromise).toEqual(
    <iq id="123" type="error">
      <foo xmlns="bar" />
      {errorElement}
    </iq>,
  );
});
