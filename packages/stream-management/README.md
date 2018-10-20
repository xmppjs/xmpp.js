# stream-management

[Stream Management](https://xmpp.org/extensions/xep-0198.html) for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

Supports Node.js and browsers.

By default answers to server ack requests and resumes connection when possible.
Requesting acks is not yet supported.

```js
sm.allowResume // defaults to true
sm.allowResume = false // disable stream resumption
```
