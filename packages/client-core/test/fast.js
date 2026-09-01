import { jest } from "@jest/globals";
import { tick } from "@xmpp/events";
import { mockClient, xml } from "@xmpp/test";
import { datetime } from "@xmpp/time";
import { Element } from "@xmpp/xml";

const mechanism = "HT-SHA-256-NONE";

test("requests and saves token if server advertises fast", async () => {
  const { entity, fast } = mockClient();

  const spy_saveToken = jest.spyOn(fast, "saveToken");

  entity.mockInput(
    // prettier-ignore
    xml('features', { xmlns: "http://etherx.jabber.org/streams" },
      xml('authentication', { xmlns: "urn:xmpp:sasl:2" },
        xml('mechanism', {}, "PLAIN"),
        xml('inline', {},
          xml('fast', { xmlns: "urn:xmpp:fast:0" },
            xml('mechanism', {}, mechanism)
          )
        )
      )
    ),
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
    // prettier-ignore
    xml('success', { xmlns: "urn:xmpp:sasl:2" },
      xml('token', { expiry, xmlns: "urn:xmpp:fast:0" , token}),
      xml('authorization-identifier', {}, "username@localhost/rOYwkWIywtnF")
    ),
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
    // prettier-ignore
    xml('features', { xmlns: "http://etherx.jabber.org/streams" },
      xml('authentication', { xmlns: "urn:xmpp:sasl:2" },
        xml('mechanism', {}, "PLAIN"),
        xml('inline', {},
          xml('fast', { xmlns: "urn:xmpp:fast:0" },
            xml('mechanism', {}, mechanism)
          )
        )
      )
    ),
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
    // prettier-ignore
    xml("failure", { xmlns: "urn:xmpp:sasl:2" },
      xml("not-authorized", { xmlns: "urn:ietf:params:xml:ns:xmpp-sasl" }),
    ),
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
    // prettier-ignore
    xml("failure", { xmlns: "urn:xmpp:sasl:2" },
      xml("credentials-expired", { xmlns: "urn:ietf:params:xml:ns:xmpp-sasl" }),
    ),
  );
  await tick();
  expect(spy_deleteToken).toHaveBeenCalled();
});
