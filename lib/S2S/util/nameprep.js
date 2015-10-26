'use strict'

var nameprep
try {
  var StringPrep = require('node-stringprep').StringPrep
  var c = function (n) {
    var p = new StringPrep(n)
    return function (s) {
      return p.prepare(s)
    }
  }
  nameprep = c('nameprep')
} catch (ex) {
  nameprep = function (a) {
    return a
  }
}

module.exports = nameprep
