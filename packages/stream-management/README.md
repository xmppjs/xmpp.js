# stream-management

[Stream Management](https://xmpp.org/extensions/xep-0198.html) for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

When the session is resumed the `online` event is not emitted as session resumption is transparent.
However `entity.status` is set to `online`.
If the session fails to resume, entity will fallback to regular session establishment in which case `online` event will be emitted.

Automatically responds to acks and requests them. Also requests periodically even if you haven't sent anything. If server fails to respond to a request, the module triggers a reconnect.

## Events

**resumed**: Indicates that the connection was resumed (so online with no online event)
**fail**: Indicates that a stanza failed to send to the server and will not be retried
**ack**: Indicates that a stanza has been acknowledged by the server

## References

[XEP-0198: Stream Management](https://xmpp.org/extensions/xep-0198.html#inline-enable)
