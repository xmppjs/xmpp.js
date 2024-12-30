import { mockClient, promise } from "@xmpp/test";
import parse from "@xmpp/xml/lib/parse.js";

const username = "foo";
const password = "bar";
const credentials = { username, password };

test("No compatible mechanism available", async () => {
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
  expect(error.message).toBe("SASL: No compatible mechanism available.");
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
});

test("with function credentials", async () => {
  expect.assertions(2);

  const mech = "PLAIN";
  let promise_authenticate;

  async function onAuthenticate(authenticate, mechanisms) {
    expect(mechanisms).toEqual([mech]);
    await authenticate(credentials, mech);
  }

  const { entity } = mockClient({ credentials: onAuthenticate });
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

  await promise_authenticate;
});

test("Mechanism not found", async () => {
  const { entity } = mockClient({
    async credentials(authenticate, _mechanisms) {
      await authenticate({ username, password }, "foo");
    },
  });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>FOO</mechanism>
      </mechanisms>
    </features>,
  );

  const error = await promise(entity, "error");
  expect(error instanceof Error).toBe(true);
  expect(error.message).toBe("SASL: No compatible mechanism available.");
});

test("with function credentials that rejects", (done) => {
  expect.assertions(1);

  const mech = "PLAIN";

  const error = {};

  async function onAuthenticate() {
    throw error;
  }

  const { entity } = mockClient({ credentials: onAuthenticate });

  entity.entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>{mech}</mechanism>
      </mechanisms>
    </features>,
  );

  entity.on("error", (err) => {
    expect(err).toBe(error);
    done();
  });
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
        <mechanism>SCRAM-SHA-1</mechanism>
        <mechanism>PLAIN</mechanism>
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
        <mechanism>PLAIN</mechanism>
        <mechanism>SCRAM-SHA-1</mechanism>
        <mechanism>ANONYMOUS</mechanism>
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
