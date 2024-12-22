import { mockClient, promise } from "@xmpp/test";
import sasl2 from "./index";

const username = "foo";
const password = "bar";
const credentials = { username, password };

function makeClient({ credentials, ...args }) {
  const entity = mockClient({ credentials, ...args });
  sasl2(entity, (credentials = { username, password }));
  return entity;
}

test("no compatibles mechanisms", async () => {
  const { entity } = makeClient({ username, password });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>FOO</mechanism>
      </authentication>
    </features>,
  );

  const error = await promise(entity, "error");
  expect(error instanceof Error).toBe(true);
  expect(error.message).toBe("No compatible mechanism");
});

test("with object credentials", async () => {
  const { entity } = makeClient({ credentials });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
      </authentication>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <authenticate xmlns="urn:xmpp:sasl:2" mechanism="PLAIN">
      <initial-response>AGZvbwBiYXI=</initial-response>
    </authenticate>,
  );

  entity.mockInput(<success xmlns="urn:xmpp:sasl:2" />);
  entity.mockInput(<features xmlns="http://etherx.jabber.org/streams" />);

  await promise(entity, "online");
});

test("with function credentials", async () => {
  const mech = "PLAIN";

  function authenticate(auth, mechanisms) {
    expect(mechanisms).toEqual([{ name: mech, canOther: true }]);
    return auth(credentials, mech);
  }

  const { entity } = makeClient({ credentials: authenticate });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>{mech}</mechanism>
      </authentication>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <authenticate xmlns="urn:xmpp:sasl:2" mechanism={mech}>
      <initial-response>AGZvbwBiYXI=</initial-response>
    </authenticate>,
  );

  entity.mockInput(<success xmlns="urn:xmpp:sasl:2" />);
  entity.mockInput(<features xmlns="http://etherx.jabber.org/streams" />);

  await promise(entity, "online");
});

test("failure", async () => {
  const { entity } = makeClient({ credentials });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
      </authentication>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <authenticate xmlns="urn:xmpp:sasl:2" mechanism="PLAIN">
      <initial-response>AGZvbwBiYXI=</initial-response>
    </authenticate>,
  );

  const failure = (
    <failure xmlns="urn:xmpp:sasl:2">
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
  const { entity } = makeClient({ credentials });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>ANONYMOUS</mechanism>
        <mechanism>PLAIN</mechanism>
        <mechanism>SCRAM-SHA-1</mechanism>
      </authentication>
    </features>,
  );

  const result = await promise(entity, "send");
  expect(result.attrs.mechanism).toEqual("SCRAM-SHA-1");
});

test.skip("use ANONYMOUS if username and password are not provided", async () => {
  const { entity } = makeClient();

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>ANONYMOUS</mechanism>
        <mechanism>PLAIN</mechanism>
        <mechanism>SCRAM-SHA-1</mechanism>
      </authentication>
    </features>,
  );

  const result = await promise(entity, "send");
  expect(result.attrs.mechanism).toEqual("ANONYMOUS");
});
