# vcard

[vcard](https://xmpp.org/extensions/xep-0054.html) for `@xmpp/client` and `@xmpp/component`.

Supports Node.js and browsers.

## Install

```js
npm install @xmpp/plugins
```

## Usage

```js
const vcard = client.plugin(require('@xmpp/plugins/vcard'))
```

## set

get vcard

```js
vcard.set({
  FN: 'John',
  N: {
    FAMILY: 'Doe',
    GIVEN: 'John'
  }
}[, service])
.then(() => {
  console.log('vcard set')
})
.catch((err) => {
  console.error('couldn\t set vcard', err)
})
```


## get

set vcard

```js
vcard.get([service]).then((vcard) => {
  console.log(vcard)
  /*
  {
    FN: 'John',
    N: {
      FAMILY: 'Doe',
      GIVEN: 'John'
    }
  }
  */
})
.catch((err) => {
  console.error('couldn\t get vcard', err)
})
```

## References

[XEP-0054: vcard-temp](https://xmpp.org/extensions/xep-0054.html)
