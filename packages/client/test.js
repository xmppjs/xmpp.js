import { mockClient, promise } from "@xmpp/test";

test("answers to ping requests", async () => {
  const { entity } = mockClient();

  entity.mockInput(
    <iq to="foo@bar" from="bar@foo" id="foo" type="get">
      <ping xmlns="urn:xmpp:ping" />
    </iq>,
  );

  expect(await promise(entity, "send")).toEqual(
    <iq to="bar@foo" from="foo@bar" id="foo" type="result" />,
  );
});
