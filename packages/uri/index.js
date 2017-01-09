'use strict'

const JID = require('@xmpp/jid').JID
const IRI = require('iri').IRI
const querystring = require('querystring')

function findQueryType (params) {
  return Object.getOwnPropertyNames(params).find(k => {
    return k[0] === '?' && params[k] === ''
  })
}

function parse (str) {
  const iri = new IRI(str)

  const uri = {}

  const path = iri.path()
  uri.path = new JID(path.startsWith('/') ? path.substr(1) : path)

  const authority = iri.authority()
  if (authority) uri.authority = new JID(authority)

  const query = iri.query()
  const params = querystring.parse(query, ';')
  const type = findQueryType(params)
  if (type) {
    delete params[type]
  }
  if (query) {
    uri.query = {
      type: type.substr(1),
      params: params
    }
  }
  return uri
}

module.exports.parse = parse
