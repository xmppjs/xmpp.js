'use strict'

var assert = require('assert')
  , core = require('../index')
  , Stanza = core.Stanza
  , IQ = core.IQ

describe('IQ', function() {

    it('is an instanceof Stanza', function() {
        var s = new IQ()
        assert(s instanceof Stanza)
    })

    it('has "iq" as node name', function() {
        var s = new IQ()
        assert(s.is('iq'))
        assert.equal(s.nodeName, 'iq')
        assert.equal(s.name, 'iq')
    })

    it('passes attrs argument down to Stanza', function() {
        var s = new IQ({foo: 'bar'})
        assert.equal(s.attrs.foo, 'bar')
    })
})


