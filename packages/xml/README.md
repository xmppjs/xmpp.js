# xml

## Install

Note, if you're using `@xml/client` or `@xml/component`, you don't need to install `@xmpp/xml` yourself.

`npm install @xmpp/xml` or `yarn add @xmpp/xml`

```js
const xml = require('@xmpp/xml')
const {xml} = require('@xmpp/client')
const {xml} = require('@xmpp/component')
```

## Writing

There's 2 methods for writing XML with xmpp.js

### factory

```js
const xml = require('@xmpp/xml')

const recipient = 'user@example.com'
const days = ['Monday', 'Tuesday']
const message = xml(
  'message',
  {to: recipient},
  xml('body', {}, 1 + 2),
  xml('days', days.map(day => xml('day', {}, day)))
)
```

Used in xmpp.js source code.

### JSX

```js
/** @jsx xml */

const xml = require('@xmpp/xml')

const recipient = 'user@example.com'
const days = ['Monday', 'Tuesday']
const message = (
  <message to={recipient}>
    <body>{1 + 2}</body>
    <days>
      {days.map(day => (
        <day>${day}</day>
      ))}
    </days>
  </message>
)
```

Used in xmpp.js tests.

Requires a [preprocessor](https://www.npmjs.com/package/babel-plugin-transform-react-jsx) but if you're already using [Babel](http://babeljs.io/) and/or need to write big chunks of XML it's a good choice. See our [.babelrc](/.babelrc) for a configuration example.

## Reading

### attributes

The `attrs` properties holds xml attributes for an element.

```js
message.attrs.to // user@example.com
```

### text

Returns the text value of an element

```js
message.getChild('body').text() // '3'
```

### getChild

Get child element by name.

```js
message.getChild('body').toString() // <body>3</body>
```

### getChildren

Get children elements by name.

```js
message.getChild('days').getChildren('day') // [...]
```

### getChildText

Get child element text value.

```js
message.getChildText('body') // '3'
```

## Editing

### attributes

The `attrs` properties holds xml attributes for an element.

```js
message.attrs.type = 'chat'
Object.assign(message.attrs, {type: 'chat'})
```

### text

Set the text value of an element

```js
message.getChild('body').text('Hello world')
```

### append

Adds text or element nodes to the last position.
Returns the parent.

```js
message.append(xml('foo'))
message.append('bar')
message.append(days.map(day => xml('day', {}, day)))
// <message>
//   ...
//   <foo/>
//   bar
//   <day>Monday</day>
//   <day>Tuesday</day>
// </message>
```

### prepend

Adds text or element nodes to the first position.
Returns the parent.

```js
message.append(xml('foo'))
message.append('bar')
message.append(days.map(day => xml('day', {}, day)))
// <message>
//   <day>Tuesday</day>
//   <day>Monday</day>
//   bar
//   <foo/>
//   ...
// </message>
```

### remove

Removes a child element.

```js
const body = message.getChild('body')
message.remove(body)
```

## JSON

You can embed JSON anywhere but it is recommended to use an appropriate semantic.

```js
/** @jsx xml */

// write
message.append(
  <myevent xmlns="xmpp:example.org">
    <json xmlns="urn:xmpp:json:0">{JSON.stringify(days)}</json>
  </myevent>
)

// read
JSON.parse(
  message
    .getChild('myevent', 'xmpp:example.org')
    .getChildText('json', 'urn:xmpp:json:0')
)
```

See [JSON Containers](https://xmpp.org/extensions/xep-0335.html)
