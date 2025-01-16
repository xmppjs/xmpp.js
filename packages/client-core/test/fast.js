import { tick } from "@xmpp/events";
import { mockClient } from "@xmpp/test";
import { datetime } from "@xmpp/time";
import { Element } from "@xmpp/xml";

const mechanism = "HT-SHA-256-NONE";

test("requests and saves token if server advertises fast", async () => {
  const { entity, fast } = mockClient();

  const spy_saveToken = jest.spyOn(fast, "saveToken");

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <fast xmlns="urn:xmpp:fast:0">
            <mechanism>{mechanism}</mechanism>
          </fast>
        </inline>
      </authentication>
    </features>,
  );

  const authenticate = await entity.catchOutgoing();
  expect(authenticate.is("authenticate", "urn:xmpp:sasl:2")).toBe(true);
  const request_token = authenticate.getChild(
    "request-token",
    "urn:xmpp:fast:0",
  );
  expect(request_token.attrs.mechanism).toBe(mechanism);

  const token = "secret-token:fast-HZzFpFwHTy4nc3C8Y1NVNZqYef_7Q3YjMLu2";
  const expiry = "2025-02-06T09:58:40.774329Z";

  expect(spy_saveToken).not.toHaveBeenCalled();

  entity.mockInput(
    <success xmlns="urn:xmpp:sasl:2">
      <token expiry={expiry} xmlns="urn:xmpp:fast:0" token={token} />
      <authorization-identifier>
        username@localhost/rOYwkWIywtnF
      </authorization-identifier>
    </success>,
  );

  expect(spy_saveToken).toHaveBeenCalledWith({ token, expiry, mechanism });
});

async function setupFast() {
  const { entity, fast } = mockClient();

  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  const expiry = datetime(d);

  fast.fetchToken = async () => {
    return {
      mechanism,
      expiry,
      token: "foobar",
    };
  };

  entity.mockInput(
    <features xmlns="http://etherx.jabber.org/streams">
      <authentication xmlns="urn:xmpp:sasl:2">
        <mechanism>PLAIN</mechanism>
        <inline>
          <fast xmlns="urn:xmpp:fast:0">
            <mechanism>{mechanism}</mechanism>
          </fast>
        </inline>
      </authentication>
    </features>,
  );

  expect(fast.mechanism).toBe(mechanism);

  const authenticate = await entity.catchOutgoing();
  expect(authenticate.is("authenticate", "urn:xmpp:sasl:2"));
  expect(authenticate.attrs.mechanism).toBe(mechanism);
  expect(authenticate.getChild("fast", "urn:xmpp:fast:0")).toBeInstanceOf(
    Element,
  );

  return entity;
}

test("deletes the token if server replies with not-authorized", async () => {
  const entity = await setupFast();
  const spy_deleteToken = jest.spyOn(entity.fast, "deleteToken");

  expect(spy_deleteToken).not.toHaveBeenCalled();
  entity.mockInput(
    <failure xmlns="urn:xmpp:sasl:2">
      <not-authorized xmlns="urn:ietf:params:xml:ns:xmpp-sasl" />
    </failure>,
  );
  await tick();
  expect(spy_deleteToken).toHaveBeenCalled();
});

test("deletes the token if server replies with credentials-expired", async () => {
  const entity = await setupFast();
  const spy_deleteToken = jest.spyOn(entity.fast, "deleteToken");

  // credentials-expired
  expect(spy_deleteToken).not.toHaveBeenCalled();
  entity.mockInput(
    <failure xmlns="urn:xmpp:sasl:2">
      <credentials-expired xmlns="urn:ietf:params:xml:ns:xmpp-sasl" />
    </failure>,
  );
  await tick();
  expect(spy_deleteToken).toHaveBeenCalled();
});
