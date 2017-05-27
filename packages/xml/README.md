XML
===

XMPP XML for JavaScript.

## Install

```
npm install @xmpp/xml
```

## Usage

```javascript
const xml = require('@xmpp/xml')

const body = '  hello  '
const stanza = xml`
  <message>
    <body>${body}</body>
  </message>
`
console.log(stanza.toString())
// <message><body>  hello  </body></message>
```
