# stream-management

[Stream Management](https://xmpp.org/extensions/xep-0198.html) for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

When the session is resumed the `online` event is not emitted as session resumption is transparent.
However `entity.status` is set to `online`.
If the session fails to resume, entity will fallback to regular session establishment in which case `online` event will be emitted.

Automatically responds to acks but does not support requesting acks yet.
