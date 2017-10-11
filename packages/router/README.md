# router

Router middleware for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```
npm install @xmpp/router
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
```

## Usage

```js
const {Client} = new require('@xmpp/client')
const middleware = require('@xmpp/middlware')
const router = require('@xmpp/router')

const client = new Client()
const app = router(middleware(client))
```

### use

`event` argument is optional and defaults to `''`

```js
router.use(event, (ctx, next) => {
})
```

### filter

`event` argument is optional and defaults to `''`

```js
router.filter(event, (ctx, next) => {
})
```
