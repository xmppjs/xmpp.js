# stream-management

[Stream Management](https://xmpp.org/extensions/xep-0198.html) for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

When the session is resumed the `online` event is not emitted as session resumption is transparent.
However `entity.status` is set to `online`.
If the session fails to resume, entity will fallback to regular session establishment in which case `online` event will be emitted.

- Automatically responds to acks.
- Periodically request acks.
- If server fails to respond, triggers a reconnect.

## Events

### resumed

Indicates that the connection was resumed. When that happens the `online` event is not emitted but `xmpp.status` will be `online`.

```js
const xmpp = client(...);
const {streamManagement} = xmpp;

streamManagement.on('resumed', () => {
  console.log("session resumed");
});
```

### fail

Indicates that a stanza failed to send to the server and will not be retried.

```js
const xmpp = client(...);
const {streamManagement} = xmpp;

streamManagement.on('fail', (stanza) => {
  console.log("fail to send", stanza.toString());
});
```

### ack

Indicates that a stanza has been acknowledged by the server.

```js
const xmpp = client(...);
const {streamManagement} = xmpp;

streamManagement.on('ack', (stanza) => {
  console.log("stanza acknowledge by the server", stanza.toString());
});
```

## References

[XEP-0198: Stream Management](https://xmpp.org/extensions/xep-0198.html#inline-enable)
