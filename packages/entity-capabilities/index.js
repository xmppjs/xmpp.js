'use strict'

const crypto = require('crypto')

const NS_CAPS = 'http://jabber.org/protocol/caps'

function compare(a, b) {
  if (a > b) {
    return 1
  }
  if (a < b) {
    return -1
  }
  return 0
}

function sortIdentities(a, b) {
  const category = compare(a.category, b.category)
  if (category !== 0) return category

  const type = compare(a.type, b.type)
  if (type !== 0) return type

  const lang = compare(a.lang, b.lang)
  if (lang !== 0) return lang

  return 0
}

function mapIdentites({attrs}) {
  return {
    category: attrs.category,
    type: attrs.type,
    name: attrs.name || '',
    lang: attrs['xml:lang'] || '',
  }
}

function hash(query) {
  let s = ''

  query
    .getChildren('identity')
    .map(x => mapIdentites(x))
    .sort(sortIdentities)
    .forEach(({category, type, name, lang}) => {
      s += `${category}/${type}/${lang}/${name}<`
    })

  query
    .getChildren('feature')
    .map(f => f.attrs.var)
    .sort()
    .forEach(feature => {
      s += `${feature}<`
    })

  query.getChildren('x', 'jabber:x:data').forEach(x => {
    const fields = x.getChildren('field')
    const formType = fields.find(field => field.attrs.var === 'FORM_TYPE')
    s += `${formType.getChildText('value')}<`
    fields.forEach(field => {
      if (field === formType) return
      s += `${field.attrs.var}<`
      field
        .getChildren('value')
        .map(v => v.text())
        .sort()
        .forEach(value => {
          s += `${value}<`
        })
    })
  })

  return crypto
    .createHash('sha1')
    .update(s)
    .digest('base64')
}

module.exports.sortIdentities = sortIdentities
module.exports.hash = hash
module.exports.NS = NS_CAPS
