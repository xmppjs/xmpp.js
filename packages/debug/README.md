# debug

Prints to the console debug information for an entity.

## Install

`npm install @xmpp/component` or `yarn add @xmpp/component`

## Example

```javascript
const {client} = require('@xmpp/client') // or component, ...
const debug = require('@xmpp/debug')
const xmpp = client()
debug(xmpp, true)
```
