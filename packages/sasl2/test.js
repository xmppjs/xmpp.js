import { mockClient, promise } from "@xmpp/test";
import parse from "@xmpp/xml/lib/parse.js";

const username = "foo";
const password = "bar";
const credentials = { username, password };

test("no compatibles mechanisms", async () => {
  const { entity } = mockClient({ username, password });

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
  const { entity } = mockClient({ credentials });

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
    expect(mechanisms).toEqual([
      { name: mech, canFast: false, canOther: true },
    ]);
    return auth(credentials, mech);
  }

  const { entity } = mockClient({ credentials: authenticate });

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
  const { entity } = mockClient({ credentials });

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
  const { entity } = mockClient({ credentials });

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

test("use ANONYMOUS if username and password are not provided", async () => {
  const { entity } = mockClient();

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

test("with whitespaces", async () => {
  const { entity } = mockClient();

  entity.mockInput(
    parse(
      `
      <features xmlns="http://etherx.jabber.org/streams">
        <authentication xmlns="urn:xmpp:sasl:2">
          <mechanism>ANONYMOUS</mechanism>
          <mechanism>PLAIN</mechanism>
          <mechanism>SCRAM-SHA-1</mechanism>
        </authentication>
      </features>
      `.trim(),
    ),
  );

  const result = await promise(entity, "send");
  expect(result.attrs.mechanism).toEqual("ANONYMOUS");
});

test("with bind2", async () => {
  const { entity } = mockClient({
    credentials,
    clientId: "uniqueid",
    software: "xmpp.js",
    device: "script",
  });

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

  expect(await promise(entity, "send")).toEqual(
    <authenticate xmlns="urn:xmpp:sasl:2" mechanism="PLAIN">
      <initial-response>AGZvbwBiYXI=</initial-response>
      <user-agent id="uniqueid">
        <software>xmpp.js</software>
        <device>script</device>
      </user-agent>
      <bind xmlns="urn:xmpp:bind:0">
        <tag>xmpp.js</tag>
      </bind>
    </authenticate>,
  );

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <authorization-identity>{entity.jid}</authorization-identity>
      <bound xmlns="urn:xmpp:bind:0" />
    </success>,
  );
  entity.mockInput(<features xmlns="http://etherx.jabber.org/streams" />);

  await promise(entity, "online");
});

test("with FAST", async () => {
  const { entity } = mockClient({
    credentials: (callback, mechanisms) => {
      expect(mechanisms).toEqual([
        { canFast: true, canOther: false, name: "HT-SHA-256-NONE" },
        { canFast: false, canOther: true, name: "PLAIN" },
      ]);
      callback(
        { ...credentials, requestToken: mechanisms[0].name },
        mechanisms[1].name,
      );
    },
  });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <fast xmlns="urn:xmpp:fast:0">
            <mechanism>HT-SHA-256-NONE</mechanism>
          </fast>
        </inline>
      </authentication>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <authenticate xmlns="urn:xmpp:sasl:2" mechanism="PLAIN">
      <initial-response>AGZvbwBiYXI=</initial-response>
      <request-token xmlns="urn:xmpp:fast:0" mechanism="HT-SHA-256-NONE" />
    </authenticate>,
  );

  entity.mockInput(<success xmlns="urn:xmpp:sasl:2" />);
  entity.mockInput(<features xmlns="http://etherx.jabber.org/streams" />);

  await promise(entity, "online");
});

test("with FAST token", async () => {
  const { entity } = mockClient({
    credentials: (callback, mechanisms) => {
      expect(mechanisms).toEqual([
        { canFast: true, canOther: false, name: "HT-SHA-256-NONE" },
        { canFast: false, canOther: true, name: "PLAIN" },
      ]);
      callback({ password: "TOKEN", fastCount: 2 }, mechanisms[0].name);
    },
  });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <fast xmlns="urn:xmpp:fast:0">
            <mechanism>HT-SHA-256-NONE</mechanism>
          </fast>
        </inline>
      </authentication>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <authenticate xmlns="urn:xmpp:sasl:2" mechanism="HT-SHA-256-NONE">
      <initial-response>
        bnVsbAAAXAywUfR/w4Mr9SUDUtNAgPDajNI073fqfiZLMYcmfA==
      </initial-response>
      <fast xmlns="urn:xmpp:fast:0" count="2" />
    </authenticate>,
  );

  entity.mockInput(<success xmlns="urn:xmpp:sasl:2" />);
  entity.mockInput(<features xmlns="http://etherx.jabber.org/streams" />);

  await promise(entity, "online");
});
