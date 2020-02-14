# stream-management

[Stream Management](https://xmpp.org/extensions/xep-0198.html) for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

Does not support requesting acks yet.

Responds to ack requests and resumes connection uppon disconnect whenever possible.

`online` event is not emitted when the session is resumed as it should be transparent.
