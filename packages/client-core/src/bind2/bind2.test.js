import { mockClient, id, promiseError } from "@xmpp/test";

function mockFeatures(entity) {
  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <bind xmlns="urn:xmpp:bind:0" />
        </inline>
      </authentication>
    </features>,
  );
}

function catchAuthenticate(entity) {
  return entity.catchOutgoing((stanza) => {
    if (stanza.is("authenticate", "urn:xmpp:sasl:2")) return true;
  });
}

test("without tag", async () => {
  const { entity } = mockClient();
  mockFeatures(entity);
  const stanza = await catchAuthenticate(entity);

  await expect(stanza.getChild("bind", "urn:xmpp:bind:0").toString()).toEqual(
    (<bind xmlns="urn:xmpp:bind:0" />).toString(),
  );
});

test("with string tag", async () => {
  const resource = id();
  const { entity } = mockClient({ resource });
  mockFeatures(entity);
  const stanza = await catchAuthenticate(entity);

  expect(stanza.getChild("bind", "urn:xmpp:bind:0").toString()).toEqual(
    (
      <bind xmlns="urn:xmpp:bind:0">
        <tag>{resource}</tag>
      </bind>
    ).toString(),
  );
});

test("with function resource returning string", async () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  function resource() {
    return "1k2k3";
  }

  const { entity } = mockClient({ resource });
  mockFeatures(entity);
  const stanza = await catchAuthenticate(entity);

  expect(stanza.getChild("bind", "urn:xmpp:bind:0").toString()).toEqual(
    (
      <bind xmlns="urn:xmpp:bind:0">
        <tag>{resource()}</tag>
      </bind>
    ).toString(),
  );
});

test("with function resource throwing", async () => {
  const error = new Error("foo");

  function resource() {
    throw error;
  }

  const { entity } = mockClient({ resource });

  const willError = promiseError(entity);

  mockFeatures(entity);

  expect(await willError).toBe(error);
});

test("with function resource returning resolved promise", async () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  async function resource() {
    return "1k2k3";
  }

  const { entity } = mockClient({ resource });
  mockFeatures(entity);
  const stanza = await catchAuthenticate(entity);

  expect(stanza.getChild("bind", "urn:xmpp:bind:0").toString()).toEqual(
    (
      <bind xmlns="urn:xmpp:bind:0">
        <tag>{await resource()}</tag>
      </bind>
    ).toString(),
  );
});

test("with function resource returning rejected promise", async () => {
  const error = new Error("foo");

  async function resource() {
    throw error;
  }

  const { entity } = mockClient({ resource });

  const willError = promiseError(entity);

  mockFeatures(entity);

  expect(await willError).toBe(error);
});
