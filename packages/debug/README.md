# debug

Prints to the console debug information for an entity.

## Install

```
npm install -g @xmpp/debug
```

## Usage

```javascript
const client = require('@xmpp/client') // or component, ...
const debug = require('@xmpp/debug')
const entity = client()
debug(entity)
```
