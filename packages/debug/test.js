import { hideSensitive } from "./index.js";

test("SASL", () => {
  expect(
    hideSensitive(<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</auth>),
  ).toEqual(
    <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </auth>,
  );

  expect(
    hideSensitive(
      <challenge xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</challenge>,
    ),
  ).toEqual(
    <challenge xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </challenge>,
  );

  expect(
    hideSensitive(
      <response xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</response>,
    ),
  ).toEqual(
    <response xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </response>,
  );

  expect(
    hideSensitive(
      <success xmlns="urn:ietf:params:xml:ns:xmpp-sasl">foo</success>,
    ),
  ).toEqual(
    <success xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <hidden xmlns="xmpp.js" />
    </success>,
  );
});

test("SASL2", () => {
  expect(
    hideSensitive(
      <authenticate xmlns="urn:xmpp:sasl:2" mechanism="SCRAM-SHA-1-PLUS">
        <initial-response>
          cD10bHMtZXhwb3J0ZXIsLG49dXNlcixyPTEyQzRDRDVDLUUzOEUtNEE5OC04RjZELTE1QzM4RjUxQ0NDNg==
        </initial-response>
      </authenticate>,
    ),
  ).toEqual(
    <authenticate xmlns="urn:xmpp:sasl:2" mechanism="SCRAM-SHA-1-PLUS">
      <initial-response>
        <hidden xmlns="xmpp.js" />
      </initial-response>
    </authenticate>,
  );

  expect(
    hideSensitive(
      <challenge xmlns="urn:xmpp:sasl:2">
        cj0xMkM0Q0Q1Qy1FMzhFLTRBOTgtOEY2RC0xNUMzOEY1MUNDQzZhMDkxMTdhNi1hYzUwLTRmMmYtOTNmMS05Mzc5OWMyYmRkZjYscz1RU1hDUitRNnNlazhiZjkyLGk9NDA5Ng==
      </challenge>,
    ),
  ).toEqual(
    <challenge xmlns="urn:xmpp:sasl:2">
      <hidden xmlns="xmpp.js" />
    </challenge>,
  );

  expect(
    hideSensitive(
      <response xmlns="urn:xmpp:sasl:2">
        Yz1jRDEwYkhNdFpYaHdiM0owWlhJc0xNY29Rdk9kQkRlUGQ0T3N3bG1BV1YzZGcxYTFXaDF0WVBUQndWaWQxMFZVLHI9MTJDNENENUMtRTM4RS00QTk4LThGNkQtMTVDMzhGNTFDQ0M2YTA5MTE3YTYtYWM1MC00ZjJmLTkzZjEtOTM3OTljMmJkZGY2LHA9VUFwbzd4bzZQYTlKK1ZhZWpmei9kRzdCb21VPQ==
      </response>,
    ),
  ).toEqual(
    <response xmlns="urn:xmpp:sasl:2">
      <hidden xmlns="xmpp.js" />
    </response>,
  );

  expect(
    hideSensitive(
      <continue xmlns="urn:xmpp:sasl:2">
        <additional-data>SSdtIGJvcmVkIG5vdy4=</additional-data>
      </continue>,
    ),
  ).toEqual(
    <continue xmlns="urn:xmpp:sasl:2">
      <additional-data>
        <hidden xmlns="xmpp.js" />
      </additional-data>
    </continue>,
  );
});

test("component handshake", () => {
  expect(
    hideSensitive(<handshake xmlns="jabber:component:accept">foo</handshake>),
  ).toEqual(
    <handshake xmlns="jabber:component:accept">
      <hidden xmlns="xmpp.js" />
    </handshake>,
  );
});
