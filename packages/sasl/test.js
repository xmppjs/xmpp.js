"use strict";

const { mockClient, promise } = require("@xmpp/test");
const parse = require("@xmpp/xml/lib/parse.js");

const username = "foo";
const password = "bar";
const credentials = { username, password };

test("no compatibles mechanisms", async () => {
  const { entity } = mockClient({ username, password });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>FOO</mechanism>
      </mechanisms>
    </features>,
  );

  const error = await promise(entity, "error");
  expect(error instanceof Error).toBe(true);
  expect(error.message).toBe("No compatible mechanism");
});

test("with object credentials", async () => {
  const { entity } = mockClient({ credentials });
  entity.restart = () => {
    entity.emit("open");
    return Promise.resolve();
  };

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>PLAIN</mechanism>
      </mechanisms>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">
      AGZvbwBiYXI=
    </auth>,
  );

  entity.mockInput(<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl" />);

  await promise(entity, "online");
});

test("with function credentials", async () => {
  const mech = "PLAIN";

  function authenticate(auth, mechanism) {
    expect(mechanism).toBe(mech);
    return auth(credentials);
  }

  const { entity } = mockClient({ credentials: authenticate });
  entity.restart = () => {
    entity.emit("open");
    return Promise.resolve();
  };

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>{mech}</mechanism>
      </mechanisms>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism={mech}>
      AGZvbwBiYXI=
    </auth>,
  );

  entity.mockInput(<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl" />);

  await promise(entity, "online");
});

test("failure", async () => {
  const { entity } = mockClient({ credentials });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>PLAIN</mechanism>
      </mechanisms>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">
      AGZvbwBiYXI=
    </auth>,
  );

  const failure = (
    <failure xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <some-condition />
    </failure>
  );

  entity.mockInput(failure);

  const error = await promise(entity, "error");
  expect(error instanceof Error).toBe(true);
  expect(error.name).toBe("SASLError");
  expect(error.condition).toBe("some-condition");
  expect(error.element).toBe(failure);
});

test("prefers SCRAM-SHA-1", async () => {
  const { entity } = mockClient({ credentials });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>ANONYMOUS</mechanism>
        <mechanism>PLAIN</mechanism>
        <mechanism>SCRAM-SHA-1</mechanism>
      </mechanisms>
    </features>,
  );

  const result = await promise(entity, "send");
  expect(result.attrs.mechanism).toEqual("SCRAM-SHA-1");
});

test("use ANONYMOUS if username and password are not provided", async () => {
  const { entity } = mockClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>ANONYMOUS</mechanism>
        <mechanism>PLAIN</mechanism>
        <mechanism>SCRAM-SHA-1</mechanism>
      </mechanisms>
    </features>,
  );

  const result = await promise(entity, "send");
  expect(result.attrs.mechanism).toEqual("ANONYMOUS");
});

test("with whitespaces", async () => {
  const { entity } = mockClient();

  entity.mockInput(
    parse(
      `
      <features xmlns="http://etherx.jabber.org/streams">
        <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
          <mechanism>ANONYMOUS</mechanism>
          <mechanism>PLAIN</mechanism>
          <mechanism>SCRAM-SHA-1</mechanism>
        </mechanisms>
      </features>
      `.trim(),
    ),
  );

  const result = await promise(entity, "send");
  expect(result.attrs.mechanism).toEqual("ANONYMOUS");
});
