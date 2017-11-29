# middleware

Middleware for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Hooks

```js
`` // match any
`presence` // match stanza with name of presence
`message` // match stanza with name of presence
`iq` // match stanza with name of iq
`NAME/XMLNS/CHILD` // match stanza with name, child xmlns and child name
`NAME-TYPE` // match stanza with name and type
`NAME-TYPE/XMLNS/CHILD` // match stanza with name, type, child xmlns and child name

## Usage

```js
const router = client.plugin(require('@xmpp/plugins/router'))
```

### use

`event` argument is optional and defaults to `''`

```js
router.use(event, incoming => {
  return foobar
})
```

### filter

`event` argument is optional and defaults to `''`

```js
router.filter(event, outgoing => {
  return foobar
})
```
