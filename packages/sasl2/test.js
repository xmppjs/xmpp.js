import { mockClient, promise } from "@xmpp/test";

const username = "foo";
const password = "bar";
const credentials = { username, password };

const userAgent = (
  <user-agent id="id">
    <software>software</software>
    <device>device</device>
  </user-agent>
);

test("No compatible mechanism available", async () => {
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
  expect(error.message).toBe("SASL: No compatible mechanism available.");
});

test("with object credentials", async () => {
  const { entity } = mockClient({ credentials, userAgent });

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
      {userAgent}
    </authenticate>,
  );

  const jid = "username@localhost/example~Ln8YSSzsyK-b_3-vIFvOJNnE";

  expect(entity.jid?.toString()).not.toBe(jid);

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <authorization-identifier>{jid}</authorization-identifier>
    </success>,
  );

  expect(entity.jid.toString()).toBe(jid);
});

test("with function credentials", async () => {
  const mech = "PLAIN";
  const userAgent = (
    <user-agent id="foo">
      <software>xmpp.js</software>
      <device>Sonny's Laptop</device>
    </user-agent>
  );

  function onAuthenticate(authenticate, mechanisms) {
    expect(mechanisms).toEqual([mech]);
    return authenticate(credentials, mech, userAgent);
  }

  const { entity } = mockClient({ credentials: onAuthenticate });

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
      {userAgent}
    </authenticate>,
  );

  const jid = "username@localhost/example~Ln8YSSzsyK-b_3-vIFvOJNnE";

  expect(entity.jid?.toString()).not.toBe(jid);

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <authorization-identifier>{jid}</authorization-identifier>
    </success>,
  );

  expect(entity.jid.toString()).toBe(jid);
});

// https://github.com/xmppjs/xmpp.js/pull/1045#discussion_r1904611099
test("with FAST token only", async () => {
  const mech = "HT-SHA-256-NONE";

  function onAuthenticate(authenticate, mechanisms, fast) {
    expect(mechanisms).toEqual([]);
    expect(fast.mechanism).toEqual(mech);
    return authenticate(
      {
        token: {
          token: "hai",
          mechanism: fast.mechanism,
        },
      },
      null,
      userAgent,
    );
  }

  const { entity } = mockClient({ credentials: onAuthenticate });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <inline>
          <fast xmlns="urn:xmpp:fast:0">
            <mechanism>{mech}</mechanism>
          </fast>
        </inline>
      </authentication>
    </features>,
  );

  expect(await promise(entity, "send")).toEqual(
    <authenticate xmlns="urn:xmpp:sasl:2" mechanism={mech}>
      <initial-response>
        bnVsbACNMNimsTBnxS04m8x7wgKjBHdDUL/nXPU4J4vqxqjBIg==
      </initial-response>
      {userAgent}
      <fast xmlns="urn:xmpp:fast:0" />
    </authenticate>,
  );

  const jid = "username@localhost/example~Ln8YSSzsyK-b_3-vIFvOJNnE";

  expect(entity.jid?.toString()).not.toBe(jid);

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <authorization-identifier>{jid}</authorization-identifier>
    </success>,
  );

  expect(entity.jid.toString()).toBe(jid);
});

test("failure", async () => {
  const { entity } = mockClient({ credentials, userAgent });

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
      {userAgent}
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
        <mechanism>SCRAM-SHA-1</mechanism>
        <mechanism>PLAIN</mechanism>
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
