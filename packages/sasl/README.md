# SASL

SASL Negotiation for `@xmpp/client`.

Included and enabled in `@xmpp/client`.

## Usage

### object

```js
const {xmpp} = require('@xmpp/client')
const client = xmpp({credentials: {
  username: 'foo',
  password: 'bar'
})
```

### function

Instead, you can provide a function that will be called every time authentication occurs (every (re)connect).

Uses cases:

- Have the user enter the password every time
- Do not ask for password before connection is made
- Debug authentication
- Using a SASL mechanism with specific requirements
- Perform an asynchronous operation to get credentials

```js
const {xmpp} = require('@xmpp/client')
const client = xmpp({credentials: authenticate})

async function authenticate(auth, mechanism) {
  console.debug('authenticate', mechanism)
  const credentials = {
    username: await prompt('enter username'),
    password: await prompt('enter password'),
  }
  console.debug('authenticating')
  try {
    await auth(credentials)
    console.debug('authenticated')
  } catch (err) {
    console.error(err)
    throw err
  }
}
```

## References

[RFC 6120 SASL Negotiation](https://xmpp.org/rfcs/rfc6120.html#sasl)
