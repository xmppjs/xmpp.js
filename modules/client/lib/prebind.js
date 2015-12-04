'use strict'

var argv = require('minimist')(process.argv.slice(2))
var Client = require('../index')

var args = JSON.parse(decodeURI(argv._))
var client = new Client(args)

client.on('error', function (error) {
  console.warn(new Error(error))
  process.exit()
})

client.on('online', function () {
  console.log({
    rid: client.connection.rid,
    sid: client.connection.sid
  })
  process.exit()
})
