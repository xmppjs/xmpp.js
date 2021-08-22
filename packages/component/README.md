# component

Much like a client, a component is an entity that connects to an XMPP server.
However components are granted special permissions. If you'd like to extend an
XMPP server with additional features a component is a good choice.

See [XEP-0114: Jabber Component Protocol](https://xmpp.org/extensions/xep-0114.html) for details.

`@xmpp/component` package includes a minimal set of features to connect /authenticate securely and reliably.

## Install

`npm install @xmpp/component @xmpp/debug`

## Example

```js
const { component, xml, jid } = require("@xmpp/component");
const debug = require("@xmpp/debug");

const xmpp = component({
  service: "xmpp://localhost:5347",
  domain: "component.localhost",
  password: "mysecretcomponentpassword",
});

debug(xmpp, true);

xmpp.on("error", (err) => {
  console.error(err);
});

xmpp.on("offline", () => {
  console.log("offline");
});

xmpp.on("stanza", async (stanza) => {
  if (stanza.is("message")) {
    await xmpp.stop();
  }
});

xmpp.on("online", async (address) => {
  console.log("online as", address.toString());

  // Sends a chat message to itself
  const message = xml(
    "message",
    { type: "chat", to: address },
    xml("body", {}, "hello world"),
  );
  await xmpp.send(message);
});

xmpp.start().catch(console.error);
```

## xml

See [xml package](/packages/xml)

## jid

See [jid package](/packages/jid)

## component

- `options` <`Object`>

  - `service` `<string>` The service to connect to, accepts an URI. eg. `xmpp://localhost:5347`
  - `domain` `<string>` Domain of the component. eg. `component.localhost`
  - `password` `<string>` Password to use to authenticate with the service.

Returns an [xmpp](#xmpp) object.

## xmpp

`xmpp` is an instance of [EventEmitter](https://nodejs.org/api/events.html).

### status

`online` indicates that `xmpp` is authenticated and addressable. It is emitted every time there is a successfull (re)connection.

`offline` indicates that `xmpp` disconnected and no automatic attempt to reconnect will happen (after calling `xmpp.stop()`).

Additional status:

- `connecting`: Socket is connecting
- `connect`: Socket is connected
- `opening`: Stream is opening
- `open`: Stream is open
- `closing`: Stream is closing
- `close`: Stream is closed
- `disconnecting`: Socket is disconnecting
- `disconnect`: Socket is disconnected

You can read the current status using the `status` property.

```js
const isOnline = xmpp.status === "online";
```

You can listen for status change using the `status` event.

### Event `status`

Emitted when the status changes.

```js
xmpp.on("status", (status) => {
  console.debug(status);
});
```

### Event `error`

Emitted when an error occurs. For connection errors, `xmpp` will reconnect on its own using [@xmpp/reconnect](/packages/reconnect) however a listener MUST be attached to avoid uncaught exceptions.

- `<Error>`

```js
xmpp.on("error", (error) => {
  console.error(error);
});
```

### Event `stanza`

Emitted when a stanza is received and parsed.

- [`<Element>`](/packages/xml)

```js
// Simple echo bot example
xmpp.on("stanza", (stanza) => {
  console.log(stanza.toString());
  if (!stanza.is("message")) return;

  const { to, from } = stanza.attrs;
  stanza.attrs.from = to;
  stanza.attrs.to = from;
  xmpp.send(stanza);
});
```

### Event `online`

Emitted when connected, authenticated and ready to receive/send stanzas.

- [`<Jid>`](/packages/jid)

```js
xmpp.on("online", (address) => {
  console.log("online as", address.toString());
});
```

### Event `offline`

Emitted when the connection is closed an no further attempt to reconnect will happen, usually after [xmpp.stop()](#xmpp.stop).

```js
xmpp.on("offline", () => {
  console.log("offline");
});
```

### start

Starts the connection. Attempts to reconnect will automatically happen if it cannot connect or gets disconnected.

```js
xmpp.start().catch(console.error);
xmpp.on("online", (address) => {
  console.log("online", address.toString());
});
```

Returns a promise that resolves if the first attempt succeed or rejects if the first attempt fails.

### stop

Stops the connection and prevent any further auto reconnect/retry.

```js
xmpp.stop().catch(console.error);
xmpp.on("offline", () => {
  console.log("offline");
});
```

Returns a promise that resolves once the stream closes and the socket disconnects.

### send

Sends a stanza.

```js
xmpp.send(xml("presence")).catch(console.error);
```

Returns a promise that resolves once the stanza is serialized and written to the socket or rejects if any of those fails.

### sendMany

Sends multiple stanzas.

Here is an example sending the same text message to multiple recipients.

```js
const message = "Hello";
const recipients = ["romeo@example.com", "juliet@example.com"];
const stanzas = recipients.map((address) =>
  xml("message", { to: address, type: "chat" }, xml("body", null, message)),
);
xmpp.sendMany(stanzas).catch(console.error);
```

Returns a promise that resolves once all the stanzas have been sent.

If you need to send a stanza to multiple recipients we recommend using [Extended Stanza Addressing](https://xmpp.org/extensions/xep-0033.html) instead.

### xmpp.reconnect

See [@xmpp/reconnect](/packages/reconnect).
