# debug

Prints to the console debug information for an entity.

Sensitive information (authentication) is replaced with `<hidden xmlns="xmpp.js"/>`

## Install

`npm install @xmpp/debug` or `yarn add @xmpp/debug`

## Example

```js
const {client} = require('@xmpp/client') // or component, ...
const debug = require('@xmpp/debug')
const xmpp = client(...)
debug(xmpp, true)
```

Here is an example output

```xml
🛈 connecting
🛈 connect
🛈 opening
⮊ <open version="1.0" xmlns="urn:ietf:params:xml:ns:xmpp-framing" to="localhost"/>
⮈ <open xml:lang="en" version="1.0" xmlns="urn:ietf:params:xml:ns:xmpp-framing" id="0374fc92-cd00-435a-9aaa-5b78b48fa3be" from="localhost"/>
⮈ <stream:features xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams">
    <register xmlns="http://jabber.org/features/iq-register"/>
    <mechanisms xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
      <mechanism>
        SCRAM-SHA-1
      </mechanism>
      <mechanism>
        PLAIN
      </mechanism>
    </mechanisms>
  </stream:features>
⮊ <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="SCRAM-SHA-1">
    <hidden xmlns="xmpp.js"/>
  </auth>
🛈 open <open xml:lang="en" version="1.0" xmlns="urn:ietf:params:xml:ns:xmpp-framing" id="0374fc92-cd00-435a-9aaa-5b78b48fa3be" from="localhost"/>
⮈ <challenge xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
    <hidden xmlns="xmpp.js"/>
  </challenge>
⮊ <response xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="SCRAM-SHA-1">
    <hidden xmlns="xmpp.js"/>
  </response>
⮈ <success xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
    <hidden xmlns="xmpp.js"/>
  </success>
🛈 opening
⮊ <open version="1.0" xmlns="urn:ietf:params:xml:ns:xmpp-framing" to="localhost"/>
⮈ <open xml:lang="en" version="1.0" xmlns="urn:ietf:params:xml:ns:xmpp-framing" id="5ce2e7a0-707d-4018-bc40-dd686b086ddb" from="localhost"/>
⮈ <stream:features xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams">
    <c xmlns="http://jabber.org/protocol/caps" hash="sha-1" node="http://prosody.im" ver="tRnaQYpc52X5dPpqfBVx/AQoDrU="/>
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <required/>
    </bind>
    <session xmlns="urn:ietf:params:xml:ns:xmpp-session">
      <optional/>
    </session>
    <ver xmlns="urn:xmpp:features:rosterver"/>
  </stream:features>
⮊ <iq type="set" id="octl1bwq3o" xmlns="jabber:client">
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <resource>
        example
      </resource>
    </bind>
  </iq>
🛈 open <open xml:lang="en" version="1.0" xmlns="urn:ietf:params:xml:ns:xmpp-framing" id="5ce2e7a0-707d-4018-bc40-dd686b086ddb" from="localhost"/>
⮈ <iq xmlns="jabber:client" id="octl1bwq3o" type="result">
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>
        username@localhost/example
      </jid>
    </bind>
  </iq>
🛈 online username@localhost/example
▶ online as username@localhost/example
⮊ <iq type="get" id="snelrjhcbp" xmlns="jabber:client">
    <query xmlns="jabber:iq:roster"/>
  </iq>
⮈ <iq xmlns="jabber:client" id="snelrjhcbp" to="username@localhost/example" type="result">
    <query xmlns="jabber:iq:roster" ver="1"/>
  </iq>
```
