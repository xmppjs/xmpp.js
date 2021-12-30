"use strict";

const test = require("ava");
const { mockClient, promise } = require("@xmpp/test");

const username = "foo";
const password = "bar";
const credentials = { username, password };

test("no compatibles mechanisms", async (t) => {
  const { entity } = mockClient({ username, password });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>FOO</mechanism>
      </mechanisms>
    </features>,
  );

  const error = await promise(entity, "error");
  t.true(error instanceof Error);
  t.is(error.message, "No compatible mechanism");
});

test("with object credentials", async (t) => {
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

  t.deepEqual(
    await promise(entity, "send"),
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">
      AGZvbwBiYXI=
    </auth>,
  );

  entity.mockInput(<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl" />);

  await promise(entity, "online");
});

test("with function credentials", async (t) => {
  const mech = "PLAIN";

  function authenticate(auth, mechanism) {
    t.is(mechanism, mech);
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

  t.deepEqual(
    await promise(entity, "send"),
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism={mech}>
      AGZvbwBiYXI=
    </auth>,
  );

  entity.mockInput(<success xmlns="urn:ietf:params:xml:ns:xmpp-sasl" />);

  await promise(entity, "online");
});

test("failure", async (t) => {
  const { entity } = mockClient({ credentials });

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
        <mechanism>PLAIN</mechanism>
      </mechanisms>
    </features>,
  );

  t.deepEqual(
    await promise(entity, "send"),
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
  t.true(error instanceof Error);
  t.is(error.name, "SASLError");
  t.is(error.condition, "some-condition");
  t.is(error.element, failure);
});

test("prefers SCRAM-SHA-1", async (t) => {
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
  t.deepEqual(result.attrs.mechanism, "SCRAM-SHA-1");
});

test("use ANONYMOUS if username and password are not provided", async (t) => {
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
  t.deepEqual(result.attrs.mechanism, "ANONYMOUS");
});
