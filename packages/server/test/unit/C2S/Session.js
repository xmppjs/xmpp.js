'use strict'

/* global describe, it */

const Session = require('../../../').C2S._Session
const assert = require('assert')
const sinon = require('sinon')
const Connection = require('node-xmpp-core').Connection

describe('C2S Session', () => {
  describe('stream start', () => {
    // http://xmpp.org/rfcs/rfc6120.html#streams-attr-to
    describe('to attribute', () => {
      it('sends a host-unknown error if stream "to" attribute is empty', () => {
        const conn = new Connection()
        const session = new Session({connection: conn}); // eslint-disable-line
        const error = sinon.stub(conn, 'error')
        conn.emit('streamStart', {to: ''})
        assert(error.calledOnce)
        assert(error.calledWith('host-unknown', "empty 'to' attibute"))
      })

      it('sends a host-unknown error if stream "to" is missing', () => {
        const conn = new Connection()
        const session = new Session({connection: conn}); // eslint-disable-line
        const error = sinon.stub(conn, 'error')
        conn.emit('streamStart', {})
        assert(error.calledOnce)
        assert(error.calledWith('host-unknown', "'to' attribute missing"))
      })
    })
  })
})
