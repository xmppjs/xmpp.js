# error

XMPP error abstraction for JavaScript.

## Install

`npm install @xmpp/error`

## Usage

```js
const XMPPError = require("@xmpp/error");

const error = new XMPPError("service-unavailable", "optional text", element);
error instanceof Error; // true
error.condition === "service-unavailable"; // true
error.text === "service-unavailabe - optional text"; // true
error.element === element; // true
```
