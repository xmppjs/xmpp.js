# xml

## Install

Note, if you're using `@xmpp/client` or `@xmpp/component`, you don't need to install `@xmpp/xml`.

`npm install @xmpp/xml`

```js
const xml = require("@xmpp/xml");
const { xml } = require("@xmpp/client");
const { xml } = require("@xmpp/component");
```

## Writing

There's 2 methods for writing XML with xmpp.js

### factory

```js
const xml = require("@xmpp/xml");

const recipient = "user@example.com";
const days = ["Monday", "Tuesday", "Wednesday"];
const message = xml(
  "message",
  { to: recipient },
  xml("body", {}, 1 + 2),
  xml(
    "days",
    {},
    days.map((day, idx) => xml("day", { idx }, day)),
  ),
);
```

If the second argument passed to `xml` is a `string` instead of an `object`, it will be set as the `xmlns` attribute.

```js
// both are equivalent
xml("time", "urn:xmpp:time");
xml("time", { xmlns: "urn:xmpp:time" });
```

### JSX

```js
/** @jsx xml */

const xml = require("@xmpp/xml");

const recipient = "user@example.com";
const days = ["Monday", "Tuesday"];
const message = (
  <message to={recipient}>
    <body>{1 + 2}</body>
    <days>
      {days.map((day, idx) => (
        <day idx={idx}>${day}</day>
      ))}
    </days>
  </message>
);
```

Requires a preprocessor such as [TypeScript](https://www.typescriptlang.org/) or [Babel](http://babeljs.io/) with [@babel/plugin-transform-react-jsx](https://babeljs.io/docs/en/next/babel-plugin-transform-react-jsx.html).

## Reading

### attributes

The `attrs` property is an object that holds xml attributes of the element.

```js
message.attrs.to; // user@example.com
```

### text

Returns the text value of an element

```js
message.getChild("body").text(); // '3'
```

### getChild

Get child element by name.

```js
message.getChild("body").toString(); // '<body>3</body>'
```

### getChildText

Get child element text value.

```js
message.getChildText("body"); // '3'
```

### getChildren

Get children elements by name.

```js
message.getChild("days").getChildren("day"); // [...]
```

Since `getChildren` returns an array, you can use JavaScript array methods such as [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) and [find](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find) to build more complex queries.

```js
const days = message.getChild("days").getChildren("day");

// Find Monday element
days.find((day) => day.text() === "Monday");
days.find((day) => day.attrs.idx === 0);

// Find all days after Tuesday
days.filter((day) => day.attrs.idx > 2);
```

### parent

You can get the parent node using the parent property.

```js
console.log(message.getChild("days").parent === message);
```

### root

You can get the root node using the root method.

```js
console.log(message.getChild("days").root() === message);
```

## Editing

### attributes

The `attrs` property is an object that holds xml attributes of the element.

```js
message.attrs.type = "chat";
Object.assign(message.attrs, { type: "chat" });
```

### text

Set the text value of an element

```js
message.getChild("body").text("Hello world");
```

### append

Adds text or element nodes to the last position.
Returns the parent.

```js
message.append(xml("foo"));
message.append("bar");
message.append(days.map((day) => xml("day", {}, day)));
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
message.prepend(xml("foo"));
message.prepend("bar");
message.prepend(days.map((day) => xml("day", {}, day)));
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
const body = message.getChild("body");
message.remove(body);
```

## JSON

You can embed JSON anywhere but it is recommended to use appropriate semantic.

```js
/** @jsx xml */

// write
message.append(
  <myevent xmlns="xmpp:example.org">
    <json xmlns="urn:xmpp:json:0">{JSON.stringify(days)}</json>
  </myevent>,
);

// read
JSON.parse(
  message
    .getChild("myevent", "xmpp:example.org")
    .getChildText("json", "urn:xmpp:json:0"),
);
```

See also [JSON Containers](https://xmpp.org/extensions/xep-0335.html) and [Simple JSON Messaging](https://xmpp.org/extensions/xep-0432.html).

## Parsing XML strings

`@xmpp/xml` include a function to parse XML strings.

⚠ Use with care. Untrusted input or substitutions can result in invalid XML and side effects.

```js
const { escapeXML, escapeXMLText };
const parse = require("@xmpp/xml/lib/parse");

const ctx = parse("<message><body>hello world</body></message>");
ctx.getChildText("body"); // hello world
```

If you must use with untrusted input, escape it with `escapeXML` and `escapeXMLText`.

```js
const { escapeXML, escapeXMLText } = require("@xmpp/xml");
const parse = require("@xmpp/xml/lib/parse");

const message = parse(`
  <message to="${escapeXML(to)}">
    <body>${escapeXMLText(body)}</body>
  </message>,
`);
```
