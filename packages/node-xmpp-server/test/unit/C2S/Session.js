'use strict'

/* global describe, it */

var Session = require('../../../').C2S._Session
var assert = require('assert')
var sinon = require('sinon')
var Connection = require('node-xmpp-core').Connection

describe('C2S Session', function () {
  describe('stream start', function () {
    // http://xmpp.org/rfcs/rfc6120.html#streams-attr-to
    describe('to attribute', function () {
      it('sends a host-unknown error if stream "to" attribute is empty', function () {
        var conn = new Connection()
        var session = new Session({connection: conn}) // eslint-disable-line
        var error = sinon.stub(conn, 'error')
        conn.emit('streamStart', {to: ''})
        assert(error.calledOnce)
        assert(error.calledWith('host-unknown', "empty 'to' attibute"))
      })

      it('sends a host-unknown error if stream "to" is missing', function () {
        var conn = new Connection()
        var session = new Session({connection: conn}) // eslint-disable-line
        var error = sinon.stub(conn, 'error')
        conn.emit('streamStart', {})
        assert(error.calledOnce)
        assert(error.calledWith('host-unknown', "'to' attribute missing"))
      })
    })
  })
})
