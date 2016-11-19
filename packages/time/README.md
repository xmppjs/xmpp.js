# time

XMPP [Date and Time Profiles](https://xmpp.org/extensions/xep-0082.html) for JavaScript

## Install

```
npm install @xmpp/time
```

## Usage

```javascript
const time = require('@xmpp/time')

time.date() // '2016-11-18'
time.time() // '20:45:30.221Z'
time.datetime() // '2016-11-18T20:45:53.513Z'
time.offset() // '-1:00'

// each method accepts an optional date or string argument

time.datetime('05 October 2011 14:48 UTC') // '2011-10-05T14:48:00.000Z'
time.datetime(new Date('05 October 2011 14:48 UTC')) // '2011-10-05T14:48:00.000Z'
```

## References

* [XEP-0082: XMPP Date and Time Profiles](https://xmpp.org/extensions/xep-0082.html)
