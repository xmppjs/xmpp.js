# middleware

Middleware for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```
npm install @xmpp/middleware
```

## Usage

```js
const { Client } = require("@xmpp/client");
const middleware = require("@xmpp/middlware");

const client = new Client();
const app = middleware({ entity: client });
```

### use

The `use` method registers a middleware for incoming stanzas.

```js
app.use((ctx, next) => {});
```

You can also specify condition `use([elName], [subName], [subNs], [elType], handler)`

```js
app.use("message", (ctx, next) => {});
app.use("message", "x", (ctx, next) => {});
app.use("message", "x", "http://jabber.org/protocol/muc#user", (ctx, next) => {});
app.use("message", "x", "http://jabber.org/protocol/muc#user", "chat", (ctx, next) => {});
app.use("message", "x", "*", "chat", (ctx, next) => {});
app.use("message", "*", "*", "chat", (ctx, next) => {});
```

### filter

The `filter` method registers a middleware for outgoing stanzas.

```js
app.filter((ctx, next) => {});
```

You can also specify condition `filter([elName], [subName], [subNs], [elType], handler)`

```js
app.filter("message", (ctx, next) => {});
app.filter("message", "x", (ctx, next) => {});
app.filter("message", "x", "http://jabber.org/protocol/muc#user", (ctx, next) => {});
app.filter("message", "x", "http://jabber.org/protocol/muc#user", "chat", (ctx, next) => {});
app.filter("message", "x", "*", "chat", (ctx, next) => {});
app.filter("message", "*", "*", "chat", (ctx, next) => {});
```
