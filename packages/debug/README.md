# debug

Prints to the console debug information for an entity.

## Install

```
npm install @xmpp/debug
```

## Usage

```javascript
// file.js
const {xmpp} = require('@xmpp/client') // or component, ...
const debug = require('@xmpp/debug')
const entity = xmpp()
debug(entity)
```

`XMPP_DEBUG=true node file.js`
