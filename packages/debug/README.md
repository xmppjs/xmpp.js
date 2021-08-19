# debug

Prints logs and debug information to the console for an entity.

Sensitive information (authentication) is replaced with `<hidden xmlns="xmpp.js"/>`

## Install

`npm install @xmpp/debug`

## Example

```js
const {client} = require('@xmpp/client') // or component, ...
const debug = require('@xmpp/debug')
const xmpp = client(...)

debug(xmpp) // requires process.env.XMPP_DEBUG
// or
debug(xmpp, true) // always enabled
```

Here is an example output

```xml
status connecting
status connect
status opening
IN
 <stream:features xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams">
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
status open <open version="1.0" xmlns="urn:ietf:params:xml:ns:xmpp-framing" xml:lang="en" id="5217eba8-57d3-4477-947b-76b9e4abe85b" from="localhost"/>
OUT
 <auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="SCRAM-SHA-1">
    <hidden xmlns="xmpp.js"/>
  </auth>
IN
 <challenge xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
    <hidden xmlns="xmpp.js"/>
  </challenge>
OUT
 <response xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="SCRAM-SHA-1">
    <hidden xmlns="xmpp.js"/>
  </response>
IN
 <success xmlns="urn:ietf:params:xml:ns:xmpp-sasl">
    <hidden xmlns="xmpp.js"/>
  </success>
status opening
IN
 <stream:features xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams">
    <ver xmlns="urn:xmpp:features:rosterver"/>
    <c ver="tRnaQYpc52X5dPpqfBVx/AQoDrU=" xmlns="http://jabber.org/protocol/caps" hash="sha-1" node="http://prosody.im"/>
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <required/>
    </bind>
    <session xmlns="urn:ietf:params:xml:ns:xmpp-session">
      <optional/>
    </session>
  </stream:features>
status open <open version="1.0" xmlns="urn:ietf:params:xml:ns:xmpp-framing" xml:lang="en" id="6b387d87-881b-4151-bcbf-a55bc621e25f" from="localhost"/>
OUT
 <iq type="set" id="h9zf631uek" xmlns="jabber:client">
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <resource>
        example
      </resource>
    </bind>
  </iq>
IN
 <iq id="h9zf631uek" xmlns="jabber:client" type="result">
    <bind xmlns="urn:ietf:params:xml:ns:xmpp-bind">
      <jid>
        username@localhost/example
      </jid>
    </bind>
  </iq>
status online username@localhost/example
online as username@localhost/example
OUT
 <presence xmlns="jabber:client"/>
OUT
 <message type="chat" to="username@localhost/example" xmlns="jabber:client">
    <body xmlns="hello world"/>
  </message>
IN
 <presence from="username@localhost/example" xmlns="jabber:client"/>
IN
 <message from="username@localhost/example" to="username@localhost/example" xmlns="jabber:client" type="chat">
    <body xmlns="hello world"/>
  </message>
OUT
 <presence type="unavailable" xmlns="jabber:client"/>
status closing
IN
 <presence from="username@localhost/example" xmlns="jabber:client" type="unavailable"/>
status close <close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>
status disconnecting
status disconnect [object Object]
status offline <close xmlns="urn:ietf:params:xml:ns:xmpp-framing"/>
offline
```
